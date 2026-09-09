<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use App\Models\NightwatchEvent;
use App\Services\EventIndexer;
use App\Services\IngestJwt;
use App\Services\IssueRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IngestController extends Controller
{
    public function store(Request $request, IngestJwt $jwt, EventIndexer $indexer, IssueRecorder $issues): JsonResponse
    {
        $token = $request->bearerToken();
        $secret = (string) config('nightkeeper.signing_key');

        if ($token === null || $secret === '') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $claims = $jwt->verify($secret, $token);
        if ($claims === null) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $environment = Environment::query()->find($claims['env']);
        if (! $environment instanceof Environment) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $decoded = $this->decodeBody($request->getContent());
        if ($decoded === null) {
            return response()->json(['message' => 'Invalid ingest body'], 400);
        }

        $records = $decoded['records'] ?? null;
        if (! is_array($records)) {
            return response()->json(['message' => 'Invalid ingest body'], 400);
        }

        $server = $this->sanitizeServer($request->header('nightwatch-server') ?? $claims['srv']);
        $now = now();
        $rows = [];
        $accepted = [];

        foreach ($records as $record) {
            if (! is_array($record) || ! is_string($record['t'] ?? null) || ! is_numeric($record['timestamp'] ?? null)) {
                continue;
            }

            $accepted[] = $record;
            $rows[] = array_merge([
                'environment_id' => $environment->id,
                't' => substr($record['t'], 0, 64),
                'occurred_at' => (float) $record['timestamp'],
                'trace_id' => isset($record['trace_id']) && is_string($record['trace_id']) ? substr($record['trace_id'], 0, 36) : null,
                'group_hash' => isset($record['_group']) && is_string($record['_group']) ? substr($record['_group'], 0, 32) : null,
                'server' => isset($record['server']) && is_string($record['server']) ? substr($record['server'], 0, 255) : $server,
                'deploy' => isset($record['deploy']) && is_string($record['deploy']) ? substr($record['deploy'], 0, 255) : null,
                'payload' => json_encode($record, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                'created_at' => $now,
            ], $indexer->columns($record));
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table((new NightwatchEvent)->getTable())->insert($chunk);
        }

        $issues->recordFromRecords($environment, $accepted);

        return response()->json((object) []);
    }

    /**
     * @return array{records?: mixed}|null
     */
    private function decodeBody(string $raw): ?array
    {
        if ($raw === '') {
            return null;
        }

        $json = @gzdecode($raw);
        if ($json === false) {
            $json = $raw;
        }

        try {
            $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }

    private function sanitizeServer(?string $raw): string
    {
        $cleaned = substr((string) preg_replace('/[^a-zA-Z0-9._-]+/', '_', trim((string) $raw)), 0, 128);

        return $cleaned !== '' ? $cleaned : 'unknown';
    }
}
