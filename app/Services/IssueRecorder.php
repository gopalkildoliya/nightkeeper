<?php

namespace App\Services;

use App\Models\Environment;
use App\Models\Issue;
use App\Models\NightwatchEvent;

class IssueRecorder
{
    /**
     * @param  list<array<string, mixed>>  $records
     */
    public function recordFromRecords(Environment $environment, array $records): void
    {
        foreach ($records as $record) {
            if (! is_array($record) || ($record['t'] ?? null) !== 'exception') {
                continue;
            }

            if (! empty($record['handled'])) {
                continue;
            }

            $hash = $record['_group'] ?? null;
            if (! is_string($hash) || $hash === '') {
                continue;
            }

            $this->upsert($environment, substr($hash, 0, 32), $record);
        }
    }

    /**
     * @param  array<string, mixed>  $record
     */
    private function upsert(Environment $environment, string $groupHash, array $record): void
    {
        $occurredAt = (float) $record['timestamp'];
        $issue = Issue::query()->firstOrNew([
            'environment_id' => $environment->id,
            'group_hash' => $groupHash,
        ]);

        if (! $issue->exists) {
            $issue->first_seen_at = $occurredAt;
            $issue->occurrences = 0;
            $issue->status = 'open';
        }

        $issue->class = isset($record['class']) && is_string($record['class']) ? substr($record['class'], 0, 255) : ($issue->class ?? 'exception');
        $issue->message = isset($record['message']) && is_string($record['message']) ? $record['message'] : ($issue->message ?? '');
        $issue->file = isset($record['file']) && is_string($record['file']) ? substr($record['file'], 0, 255) : $issue->file;
        $issue->line = isset($record['line']) && is_numeric($record['line']) ? (int) $record['line'] : $issue->line;
        $issue->last_seen_at = $occurredAt;
        $issue->occurrences++;
        $issue->status = 'open';
        $issue->save();

        $issue->users_affected = (int) NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType('exception')
            ->where('group_hash', $groupHash)
            ->where('handled', false)
            ->whereNotNull('user_id')
            ->selectRaw('count(distinct user_id) as aggregate')
            ->value('aggregate');
        $issue->save();
    }
}
