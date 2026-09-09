<?php

namespace Database\Factories;

use App\Models\Environment;
use App\Models\NightwatchEvent;
use App\Services\EventIndexer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<NightwatchEvent>
 */
class NightwatchEventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'environment_id' => Environment::factory(),
            ...$this->requestAttributes('/deals', 'GET', 200, 45_000),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (NightwatchEvent $event): void {
            $columns = (new EventIndexer)->columns($event->payload ?? []);
            $event->forceFill($columns);
        });
    }

    public function request(string $path = '/deals', string $method = 'GET', int $status = 200, int $durationUs = 45_000): static
    {
        return $this->state(fn (): array => $this->requestAttributes($path, $method, $status, $durationUs));
    }

    public function query(string $sql = 'select * from deals', int $durationUs = 1_200): static
    {
        $group = substr(md5('sqlite|'.$sql), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'query',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'query',
                'timestamp' => $timestamp,
                'sql' => $sql,
                'duration' => $durationUs,
                'connection' => 'mysql',
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function exception(string $class = 'RuntimeException', string $message = 'sample boom', bool $handled = false): static
    {
        $group = substr(md5($class.'|0|app/Http/Controllers/DealController.php|42'), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'exception',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'exception',
                'timestamp' => $timestamp,
                'class' => $class,
                'message' => $message,
                'code' => '0',
                'file' => 'app/Http/Controllers/DealController.php',
                'line' => 42,
                'handled' => $handled,
                'user' => '42',
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function unhandled(): static
    {
        return $this->exception(handled: false);
    }

    public function handled(): static
    {
        return $this->exception(handled: true);
    }

    public function command(
        string $name = 'inspire',
        string $command = 'inspire',
        int $exitCode = 0,
        int $durationUs = 12_000,
        string $class = 'Illuminate\\Foundation\\Console\\InspireCommand',
    ): static {
        $group = substr(md5($name), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'command',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'command',
                'timestamp' => $timestamp,
                'class' => $class,
                'name' => $name,
                'command' => $command,
                'exit_code' => $exitCode,
                'duration' => $durationUs,
                'bootstrap' => 4_000,
                'action' => max(1_000, $durationUs - 5_000),
                'terminating' => 1_000,
                'exceptions' => $exitCode === 0 ? 0 : 1,
                'logs' => 0,
                'queries' => 2,
                'lazy_loads' => 0,
                'jobs_queued' => 0,
                'mail' => 0,
                'notifications' => 0,
                'outgoing_requests' => 0,
                'files_read' => 0,
                'files_written' => 0,
                'cache_events' => 0,
                'hydrated_models' => 0,
                'peak_memory_usage' => 33_554_432,
                'exception_preview' => '',
                'context' => '',
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function jobAttempt(string $name = 'App\\Jobs\\SyncDeals', string $status = 'processed', int $durationUs = 80_000): static
    {
        $group = substr(md5($name), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'job-attempt',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'worker-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'job-attempt',
                'timestamp' => $timestamp,
                'name' => $name,
                'status' => $status,
                'duration' => $durationUs,
                'attempt' => 1,
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function outgoingRequest(string $host = 'api.stripe.com', string $method = 'GET', int $status = 200, int $durationUs = 40_000): static
    {
        $group = substr(md5($host), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();
        $url = 'https://'.$host.'/v1/charges';

        return $this->state(fn (): array => [
            't' => 'outgoing-request',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'outgoing-request',
                'timestamp' => $timestamp,
                'host' => $host,
                'method' => $method,
                'url' => $url,
                'duration' => $durationUs,
                'request_size' => 128,
                'response_size' => 2048,
                'status_code' => $status,
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function cacheEvent(string $key = 'users.1', string $type = 'hit', string $store = 'redis', int $durationUs = 400): static
    {
        $group = substr(md5($store.','.$key), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'cache-event',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'cache-event',
                'timestamp' => $timestamp,
                'store' => $store,
                'key' => $key,
                'type' => $type,
                'duration' => $durationUs,
                'ttl' => $type === 'write' ? 3600 : 0,
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function mail(
        string $class = 'App\\Mail\\DealSynced',
        string $subject = 'Deal synced',
        bool $failed = false,
        int $durationUs = 12_000,
    ): static {
        $group = substr(md5($class), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'mail',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'mail',
                'timestamp' => $timestamp,
                'mailer' => 'smtp',
                'class' => $class,
                'subject' => $subject,
                'to' => 1,
                'cc' => 0,
                'bcc' => 0,
                'attachments' => 0,
                'duration' => $durationUs,
                'failed' => $failed,
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function notification(
        string $class = 'App\\Notifications\\DealSynced',
        string $channel = 'mail',
        bool $failed = false,
        int $durationUs = 8_000,
    ): static {
        $group = substr(md5($class), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'notification',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'notification',
                'timestamp' => $timestamp,
                'channel' => $channel,
                'class' => $class,
                'duration' => $durationUs,
                'failed' => $failed,
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    public function scheduledTask(
        string $name = 'inspire',
        string $status = 'processed',
        int $durationUs = 25_000,
        string $cron = '* * * * *',
    ): static {
        $group = substr(md5($name.','.$cron.',UTC'), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return $this->state(fn (): array => [
            't' => 'scheduled-task',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'scheduled-task',
                'timestamp' => $timestamp,
                'name' => $name,
                'cron' => $cron,
                'timezone' => 'UTC',
                'repeat_seconds' => 0,
                'status' => $status,
                'duration' => $durationUs,
                'exceptions' => $status === 'failed' ? 1 : 0,
                'logs' => 0,
                'queries' => 2,
                'lazy_loads' => 0,
                'jobs_queued' => 0,
                'mail' => 0,
                'notifications' => 0,
                'outgoing_requests' => 0,
                'files_read' => 0,
                'files_written' => 0,
                'cache_events' => 0,
                'hydrated_models' => 0,
                'peak_memory_usage' => 16_777_216,
                'exception_preview' => '',
                'context' => '',
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function requestAttributes(string $path, string $method, int $status, int $durationUs): array
    {
        $group = substr(md5($method.'|'.$path), 0, 32);
        $trace = (string) Str::uuid();
        $timestamp = (float) now()->getTimestamp();

        return [
            't' => 'request',
            'occurred_at' => $timestamp,
            'trace_id' => $trace,
            'group_hash' => $group,
            'server' => 'web-1',
            'deploy' => 'local',
            'payload' => [
                't' => 'request',
                'timestamp' => $timestamp,
                'method' => $method,
                'route_path' => $path,
                'url' => 'https://app.test'.$path,
                'status_code' => $status,
                'duration' => $durationUs,
                'bootstrap' => 5_000,
                'before_middleware' => 3_000,
                'action' => max(1_000, $durationUs - 12_000),
                'render' => 2_000,
                'after_middleware' => 1_000,
                'sending' => 500,
                'terminating' => 500,
                'trace_id' => $trace,
                '_group' => $group,
            ],
            'created_at' => now(),
        ];
    }
}
