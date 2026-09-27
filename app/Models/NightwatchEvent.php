<?php

namespace App\Models;

use App\Support\Duration;
use Database\Factories\NightwatchEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Number;

#[Fillable([
    'environment_id',
    't',
    'occurred_at',
    'trace_id',
    'group_hash',
    'server',
    'deploy',
    'payload',
    'duration_us',
    'status_code',
    'handled',
    'user_id',
    'status',
    'label',
    'created_at',
])]
class NightwatchEvent extends Model
{
    /** @use HasFactory<NightwatchEventFactory> */
    use HasFactory;

    public $timestamps = false;

    /**
     * @return BelongsTo<Environment, $this>
     */
    public function environment(): BelongsTo
    {
        return $this->belongsTo(Environment::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForEnvironment(Builder $query, Environment $environment): Builder
    {
        return $query->where('environment_id', $environment->id);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'float',
            'payload' => 'array',
            'created_at' => 'datetime',
            'duration_us' => 'integer',
            'status_code' => 'integer',
            'handled' => 'boolean',
        ];
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('t', $type);
    }

    public function title(): string
    {
        if ($this->t === 'command') {
            return $this->commandName();
        }

        if (filled($this->label)) {
            return $this->label;
        }

        $payload = $this->payload ?? [];

        return match ($this->t) {
            'request' => trim(($payload['method'] ?? '').' '.($payload['route_path'] ?? $payload['url'] ?? '')),
            'command' => $this->commandName(),
            'scheduled-task' => (string) ($payload['name'] ?? 'scheduled-task'),
            'job-attempt' => trim(($payload['name'] ?? 'job').' #'.($payload['attempt'] ?? '?')),
            'query' => (string) ($payload['sql'] ?? 'query'),
            'exception' => trim(($payload['class'] ?? 'exception').': '.($payload['message'] ?? '')),
            'outgoing-request' => trim(($payload['method'] ?? '').' '.($payload['url'] ?? $payload['host'] ?? '')),
            'log' => trim(($payload['level'] ?? 'log').' '.($payload['message'] ?? '')),
            'cache-event' => trim(($payload['type'] ?? 'cache').' '.($payload['key'] ?? '')),
            'mail' => (string) ($payload['class'] ?? $payload['subject'] ?? 'mail'),
            'notification' => (string) ($payload['class'] ?? 'notification'),
            default => (string) ($this->t ?? 'event'),
        };
    }

    public function statusLabel(): string
    {
        $payload = $this->payload ?? [];

        if (in_array($this->t, ['request', 'outgoing-request'], true)) {
            return (string) ($this->status_code ?? $payload['status_code'] ?? '');
        }

        if ($this->t === 'cache-event') {
            return (string) ($this->status ?? $payload['type'] ?? '');
        }

        if (in_array($this->t, ['mail', 'notification'], true)) {
            return ($payload['failed'] ?? false) === true || $this->status === 'failed' ? 'failed' : 'sent';
        }

        if ($this->status) {
            return $this->status;
        }

        if (isset($payload['status'])) {
            return (string) $payload['status'];
        }

        if ($this->t === 'command') {
            $exit = $this->commandExitCode();

            if ($exit === null) {
                return '';
            }

            return $exit === 0 ? 'success' : 'exit '.$exit;
        }

        if ($this->t === 'exception') {
            return $this->handled ? 'handled' : 'unhandled';
        }

        return '';
    }

    public function durationUs(): ?int
    {
        if ($this->duration_us !== null) {
            return (int) $this->duration_us;
        }

        $duration = $this->payload['duration'] ?? null;

        return is_numeric($duration) ? (int) $duration : null;
    }

    public function durationLabel(): string
    {
        return Duration::label($this->durationUs());
    }

    public function occurredAtLabel(): string
    {
        return gmdate('Y-m-d H:i:s', (int) $this->occurred_at).' UTC';
    }

    public function isError(): bool
    {
        $payload = $this->payload ?? [];
        $code = $this->status_code ?? $payload['status_code'] ?? null;
        $exit = $this->commandExitCode();

        return $this->t === 'exception'
            || ($this->status ?? $payload['status'] ?? null) === 'failed'
            || in_array($this->status ?? $payload['type'] ?? null, ['write-failure', 'delete-failure'], true)
            || ($payload['failed'] ?? false) === true
            || (is_numeric($code) && (int) $code >= 500)
            || ($this->t === 'command' && $exit !== null && $exit !== 0);
    }

    /**
     * @return array<string, mixed>
     */
    public function toDashboardArray(bool $includePayload = false): array
    {
        $payload = $this->payload ?? [];
        $data = [
            'id' => $this->id,
            't' => $this->t,
            'title' => $this->title(),
            'status_label' => $this->statusLabel(),
            'duration_label' => $this->durationLabel(),
            'occurred_at_label' => $this->occurredAtLabel(),
            'is_error' => $this->isError(),
            'trace_id' => $this->trace_id,
            'server' => $this->server,
        ];

        if (in_array($this->t, ['command', 'scheduled-task'], true)) {
            $data['class'] = is_string($payload['class'] ?? null) ? $payload['class'] : null;
            $data['command_line'] = filled($payload['command'] ?? null) ? (string) $payload['command'] : null;
            $data['queries'] = is_numeric($payload['queries'] ?? null) ? (int) $payload['queries'] : null;
            $data['exceptions'] = is_numeric($payload['exceptions'] ?? null) ? (int) $payload['exceptions'] : null;
            $data['peak_memory_label'] = $this->peakMemoryLabel();
            $data['cron'] = is_string($payload['cron'] ?? null) ? $payload['cron'] : null;
        }

        if ($includePayload) {
            $data['payload'] = $this->payload;
        }

        return $data;
    }

    /**
     * @return array{
     *     code: string|null,
     *     php_version: string|null,
     *     laravel_version: string|null,
     *     execution_source: string|null,
     *     user: string|null,
     *     server: string|null,
     *     deploy: string|null,
     *     trace_id: string|null,
     *     occurred_at_label: string,
     *     frames: list<array{file: string|null, source: string|null, code: array<string, string>|null}>,
     * }|null
     */
    public function exceptionDetail(): ?array
    {
        if ($this->t !== 'exception') {
            return null;
        }

        $payload = $this->payload ?? [];

        return [
            'code' => isset($payload['code']) && is_scalar($payload['code']) ? (string) $payload['code'] : null,
            'php_version' => is_string($payload['php_version'] ?? null) ? $payload['php_version'] : null,
            'laravel_version' => is_string($payload['laravel_version'] ?? null) ? $payload['laravel_version'] : null,
            'execution_source' => is_string($payload['execution_source'] ?? null) ? $payload['execution_source'] : null,
            'user' => $this->user_id,
            'server' => $this->server,
            'deploy' => $this->deploy,
            'trace_id' => $this->trace_id,
            'occurred_at_label' => $this->occurredAtLabel(),
            'frames' => $this->exceptionFrames($payload),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return list<array{file: string|null, source: string|null, code: array<string, string>|null}>
     */
    private function exceptionFrames(array $payload): array
    {
        $trace = $payload['trace'] ?? null;

        if (is_string($trace)) {
            $trace = json_decode($trace, true);
        }

        if (! is_array($trace)) {
            return [];
        }

        return array_values(array_map(fn (array $frame): array => [
            'file' => is_string($frame['file'] ?? null) ? $frame['file'] : null,
            'source' => is_string($frame['source'] ?? null) ? $frame['source'] : null,
            'code' => is_array($frame['code'] ?? null) ? $frame['code'] : null,
        ], array_filter($trace, 'is_array')));
    }

    public function commandExitCode(): ?int
    {
        if ($this->t === 'command' && $this->status_code !== null) {
            return (int) $this->status_code;
        }

        $exit = $this->payload['exit_code'] ?? null;

        return is_numeric($exit) ? (int) $exit : null;
    }

    private function commandName(): string
    {
        $payload = $this->payload ?? [];

        if (filled($payload['name'] ?? null)) {
            return (string) $payload['name'];
        }

        if (filled($payload['command'] ?? null)) {
            return (string) $payload['command'];
        }

        if (filled($payload['class'] ?? null)) {
            return (string) $payload['class'];
        }

        return 'command';
    }

    private function peakMemoryLabel(): string
    {
        $bytes = $this->payload['peak_memory_usage'] ?? null;

        if (! is_numeric($bytes) || (int) $bytes <= 0) {
            return '—';
        }

        return Number::fileSize((int) $bytes);
    }
}
