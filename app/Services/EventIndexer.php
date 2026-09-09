<?php

namespace App\Services;

class EventIndexer
{
    /**
     * @param  array<string, mixed>  $record
     * @return array{
     *     duration_us: int|null,
     *     status_code: int|null,
     *     handled: bool|null,
     *     user_id: string|null,
     *     status: string|null,
     *     label: string|null
     * }
     */
    public function columns(array $record): array
    {
        $duration = $record['duration'] ?? null;
        $statusCode = $record['status_code'] ?? $record['exit_code'] ?? null;
        $user = $record['user'] ?? null;

        if (($record['t'] ?? null) === 'user' && is_string($record['id'] ?? null) && $record['id'] !== '') {
            $user = $record['id'];
        }

        return [
            'duration_us' => is_numeric($duration) ? (int) $duration : null,
            'status_code' => is_numeric($statusCode) ? (int) $statusCode : null,
            'handled' => array_key_exists('handled', $record) ? (bool) $record['handled'] : null,
            'user_id' => is_string($user) && $user !== '' ? substr($user, 0, 255) : null,
            'status' => $this->status($record),
            'label' => $this->label($record),
        ];
    }

    /**
     * @param  array<string, mixed>  $record
     */
    public function label(array $record): ?string
    {
        $type = $record['t'] ?? null;

        $label = match ($type) {
            'request' => trim(($record['method'] ?? '').' '.($record['route_path'] ?? $record['url'] ?? '')),
            'command' => $this->commandLabel($record),
            'scheduled-task' => (string) ($record['name'] ?? 'scheduled-task'),
            'job-attempt' => (string) ($record['name'] ?? 'job'),
            'query' => (string) ($record['sql'] ?? 'query'),
            'exception' => trim(($record['class'] ?? 'exception').': '.($record['message'] ?? '')),
            'outgoing-request' => trim(($record['method'] ?? '').' '.($record['url'] ?? $record['host'] ?? '')),
            'log' => trim(($record['level'] ?? 'log').' '.($record['message'] ?? '')),
            'cache-event' => trim(($record['type'] ?? 'cache').' '.($record['key'] ?? '')),
            'mail' => (string) ($record['class'] ?? $record['subject'] ?? 'mail'),
            'notification' => (string) ($record['class'] ?? 'notification'),
            default => is_string($type) ? $type : null,
        };

        if ($label === null || $label === '') {
            return null;
        }

        return substr($label, 0, 255);
    }

    /**
     * @param  array<string, mixed>  $record
     */
    private function status(array $record): ?string
    {
        if (isset($record['status']) && is_string($record['status'])) {
            return substr($record['status'], 0, 32);
        }

        $type = $record['t'] ?? null;

        if ($type === 'cache-event' && is_string($record['type'] ?? null)) {
            return substr($record['type'], 0, 32);
        }

        if (in_array($type, ['mail', 'notification'], true)) {
            return ($record['failed'] ?? false) === true ? 'failed' : 'sent';
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $record
     */
    private function commandLabel(array $record): string
    {
        if (filled($record['name'] ?? null)) {
            return (string) $record['name'];
        }

        if (filled($record['command'] ?? null)) {
            return (string) $record['command'];
        }

        if (filled($record['class'] ?? null)) {
            return (string) $record['class'];
        }

        return 'command';
    }
}
