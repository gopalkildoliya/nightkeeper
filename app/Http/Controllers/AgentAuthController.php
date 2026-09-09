<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use App\Services\IngestJwt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentAuthController extends Controller
{
    public function store(Request $request, IngestJwt $jwt): JsonResponse
    {
        $token = $request->bearerToken();
        $environment = $this->environmentForToken($token);

        if ($environment === null) {
            return response()->json([
                'message' => 'Invalid environment token',
                'refresh_in' => 3600,
            ], 401);
        }

        $secret = (string) config('nightkeeper.signing_key');
        if ($secret === '') {
            return response()->json(['message' => 'Server misconfigured'], 500);
        }

        $server = $this->sanitizeServer($request->header('nightwatch-server'));
        $expiresIn = (int) config('nightkeeper.expires_in');
        $refreshIn = (int) config('nightkeeper.refresh_in');

        return response()->json([
            'token' => $jwt->sign($secret, $server, $environment->id, expiresInSec: $expiresIn),
            'expires_in' => $expiresIn,
            'refresh_in' => $refreshIn,
            'ingest_url' => url('/api/ingest'),
        ]);
    }

    private function environmentForToken(?string $token): ?Environment
    {
        if ($token === null || $token === '') {
            return null;
        }

        $environment = Environment::query()->where('token', $token)->first();

        if ($environment === null || ! hash_equals($environment->token, $token)) {
            return null;
        }

        return $environment;
    }

    private function sanitizeServer(?string $raw): string
    {
        $cleaned = substr((string) preg_replace('/[^a-zA-Z0-9._-]+/', '_', trim((string) $raw)), 0, 128);

        return $cleaned !== '' ? $cleaned : 'unknown';
    }
}
