<?php

namespace App\Services;

use App\Models\Environment;
use App\Models\NightwatchEvent;
use App\Support\Duration;
use App\Support\EventGroup;
use App\Support\Percentile;
use App\TimeRange;
use Illuminate\Support\Collection;

class DashboardMetrics
{
    /**
     * @return array{
     *     range: array{value: string, label: string},
     *     request_count: int,
     *     status: array{xx123: int, xx4: int, xx5: int},
     *     duration: array{min: int|null, max: int|null, avg: float|null, p95: float|null, min_label: string, max_label: string, avg_label: string, p95_label: string},
     *     buckets: list<array{start: int, label: string, total: int, xx123: int, xx4: int, xx5: int, avg_us: float|null}>,
     *     slow_routes: Collection<int, EventGroup>,
     *     slow_route_threshold_label: string,
     *     exceptions: array{total: int, handled: int, unhandled: int, users: int},
     *     jobs: array{attempts: int, min_us: int|null, max_us: int|null, min_label: string, max_label: string}
     * }
     */
    public function overview(Environment $environment, TimeRange $range): array
    {
        $requests = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType('request')
            ->where('occurred_at', '>=', $range->since())
            ->get(['occurred_at', 'duration_us', 'status_code', 'group_hash', 'label', 'payload', 'trace_id', 'user_id']);

        $durations = $requests->pluck('duration_us')->filter(fn ($value) => $value !== null)->map(fn ($value) => (int) $value)->values()->all();
        $min = $durations === [] ? null : min($durations);
        $max = $durations === [] ? null : max($durations);
        $avg = $durations === [] ? null : array_sum($durations) / count($durations);
        $p95 = Percentile::nearestRank($durations, 95);
        $jobs = $this->jobSnapshot($environment, $range);

        return [
            'range' => $range->toArray(),
            'request_count' => $requests->count(),
            'status' => [
                'xx123' => $requests->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx123')->count(),
                'xx4' => $requests->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx4')->count(),
                'xx5' => $requests->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx5')->count(),
            ],
            'duration' => [
                'min' => $min,
                'max' => $max,
                'avg' => $avg,
                'p95' => $p95,
                'min_label' => Duration::label($min),
                'max_label' => Duration::label($max),
                'avg_label' => Duration::label($avg),
                'p95_label' => Duration::label($p95),
            ],
            'buckets' => $this->requestBuckets($requests, $range),
            'slow_routes' => $this->groupsFor($requests, 'request')
                ->filter(fn (EventGroup $group) => ($group->maxUs ?? 0) >= (int) config('nightkeeper.slow_route_us'))
                ->sortByDesc(fn (EventGroup $group) => $group->maxUs)
                ->values(),
            'slow_route_threshold_label' => Duration::label((int) config('nightkeeper.slow_route_us')),
            'exceptions' => $this->exceptionSnapshot($environment, $range),
            'jobs' => [
                ...$jobs,
                'min_label' => Duration::label($jobs['min_us']),
                'max_label' => Duration::label($jobs['max_us']),
            ],
        ];
    }

    /**
     * @return Collection<int, EventGroup>
     */
    public function groups(Environment $environment, string $type, TimeRange $range): Collection
    {
        $events = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType($type)
            ->where('occurred_at', '>=', $range->since())
            ->whereNotNull('group_hash')
            ->orderByDesc('occurred_at')
            ->get();

        $groups = $this->groupsFor($events, $type);

        return match ($type) {
            'query' => $groups->sortByDesc(fn (EventGroup $group) => $group->p95Us ?? 0)->values(),
            default => $groups->sortByDesc(fn (EventGroup $group) => $group->occurrences)->values(),
        };
    }

    /**
     * @return list<array{start: int, label: string, total: int, segments: array<string, int>}>
     */
    public function volumeBuckets(Environment $environment, string $type, TimeRange $range): array
    {
        $keys = $this->volumeKeys($type);
        $events = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType($type)
            ->where('occurred_at', '>=', $range->since())
            ->get(['occurred_at', 'status_code', 'status', 'handled']);

        $size = $range->bucketSeconds();
        $end = (int) now()->getTimestamp();
        $start = (int) $range->since();
        $firstBucket = intdiv($start, $size) * $size;
        $buckets = [];

        for ($cursor = $firstBucket; $cursor <= $end; $cursor += $size) {
            $buckets[$cursor] = [
                'start' => $cursor,
                'label' => $range->bucketLabel($cursor),
                'total' => 0,
                'segments' => array_fill_keys($keys, 0),
            ];
        }

        foreach ($events as $event) {
            $key = intdiv((int) $event->occurred_at, $size) * $size;
            if (! isset($buckets[$key])) {
                continue;
            }

            $buckets[$key]['total']++;
            $segment = $this->volumeSegment($event, $type);
            if ($segment !== null && array_key_exists($segment, $buckets[$key]['segments'])) {
                $buckets[$key]['segments'][$segment]++;
            }
        }

        return array_values($buckets);
    }

    /**
     * @return Collection<int, NightwatchEvent>
     */
    public function occurrences(Environment $environment, string $type, string $groupHash, TimeRange $range): Collection
    {
        return NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType($type)
            ->where('group_hash', $groupHash)
            ->where('occurred_at', '>=', $range->since())
            ->orderByDesc('occurred_at')
            ->get();
    }

    /**
     * @return list<array{t: string, title: string, start: float, duration_us: int, event: NightwatchEvent|null}>
     */
    public function traceSpans(Collection $events, NightwatchEvent $parent): array
    {
        $spans = [];

        $spans[] = [
            't' => $parent->t,
            'title' => $parent->title(),
            'start' => (float) $parent->occurred_at,
            'duration_us' => $parent->durationUs() ?? 0,
            'event' => $parent,
        ];

        foreach ($this->stageSpans($parent) as $span) {
            $spans[] = $span;
        }

        foreach ($events as $event) {
            if ($event->id === $parent->id) {
                continue;
            }

            $spans[] = [
                't' => $event->t,
                'title' => $event->title(),
                'start' => (float) $event->occurred_at,
                'duration_us' => $event->durationUs() ?? 0,
                'event' => $event,
            ];
        }

        usort($spans, fn (array $a, array $b) => $a['start'] <=> $b['start']);

        return $spans;
    }

    /**
     * @param  Collection<int, NightwatchEvent>  $events
     * @return Collection<int, EventGroup>
     */
    private function groupsFor(Collection $events, string $type): Collection
    {
        return $events
            ->filter(fn (NightwatchEvent $event) => filled($event->group_hash))
            ->groupBy('group_hash')
            ->map(function (Collection $items, string $hash) use ($type) {
                $latest = $items->sortByDesc('occurred_at')->first();
                $durations = $items->pluck('duration_us')->filter(fn ($value) => $value !== null)->map(fn ($value) => (int) $value)->values()->all();
                $payload = $latest->payload ?? [];

                return new EventGroup(
                    groupHash: $hash,
                    label: $this->groupLabel($type, $latest, $payload),
                    occurrences: $items->count(),
                    avgUs: $durations === [] ? null : array_sum($durations) / count($durations),
                    p95Us: Percentile::nearestRank($durations, 95),
                    maxUs: $durations === [] ? null : max($durations),
                    minUs: $durations === [] ? null : min($durations),
                    lastSeenAt: (float) $latest->occurred_at,
                    counts: $this->groupCounts($items, $type),
                    usersAffected: $items->pluck('user_id')->filter()->unique()->count(),
                    sampleTraceId: $latest->trace_id,
                    meta: [
                        'class' => $payload['class'] ?? null,
                        'file' => $payload['file'] ?? null,
                        'line' => $payload['line'] ?? null,
                        'message' => $payload['message'] ?? null,
                        'connection' => $payload['connection'] ?? null,
                        'sql' => $payload['sql'] ?? null,
                        'name' => $payload['name'] ?? null,
                        'host' => $payload['host'] ?? null,
                        'store' => $payload['store'] ?? null,
                        'key' => $payload['key'] ?? null,
                        'mailer' => $payload['mailer'] ?? null,
                        'subject' => $payload['subject'] ?? null,
                        'channel' => $payload['channel'] ?? null,
                        'cron' => $payload['cron'] ?? null,
                        'timezone' => $payload['timezone'] ?? null,
                    ],
                );
            })
            ->values();
    }

    /**
     * @param  Collection<int, NightwatchEvent>  $items
     * @return array<string, int>
     */
    private function groupCounts(Collection $items, string $type): array
    {
        if ($type === 'request') {
            return [
                'xx123' => $items->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx123')->count(),
                'xx4' => $items->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx4')->count(),
                'xx5' => $items->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx5')->count(),
            ];
        }

        if ($type === 'exception') {
            return [
                'handled' => $items->where('handled', true)->count(),
                'unhandled' => $items->filter(fn (NightwatchEvent $event) => $event->handled !== true)->count(),
            ];
        }

        if ($type === 'job-attempt') {
            return [
                'processed' => $items->where('status', 'processed')->count(),
                'failed' => $items->where('status', 'failed')->count(),
                'released' => $items->where('status', 'released')->count(),
            ];
        }

        if ($type === 'command') {
            return [
                'succeeded' => $items->filter(fn (NightwatchEvent $event) => $event->commandExitCode() === 0)->count(),
                'failed' => $items->filter(fn (NightwatchEvent $event) => ($event->commandExitCode() ?? 0) !== 0)->count(),
            ];
        }

        if ($type === 'outgoing-request') {
            return [
                'xx123' => $items->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx123')->count(),
                'xx4' => $items->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx4')->count(),
                'xx5' => $items->filter(fn (NightwatchEvent $event) => $this->statusFamily($event->status_code) === 'xx5')->count(),
            ];
        }

        if ($type === 'cache-event') {
            return [
                'hit' => $items->where('status', 'hit')->count(),
                'miss' => $items->where('status', 'miss')->count(),
                'write' => $items->where('status', 'write')->count(),
                'delete' => $items->where('status', 'delete')->count(),
                'failures' => $items->filter(fn (NightwatchEvent $event) => in_array($event->status, ['write-failure', 'delete-failure'], true))->count(),
            ];
        }

        if (in_array($type, ['mail', 'notification'], true)) {
            return [
                'sent' => $items->where('status', 'sent')->count(),
                'failed' => $items->where('status', 'failed')->count(),
            ];
        }

        if ($type === 'scheduled-task') {
            return [
                'processed' => $items->where('status', 'processed')->count(),
                'failed' => $items->where('status', 'failed')->count(),
                'skipped' => $items->where('status', 'skipped')->count(),
            ];
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function groupLabel(string $type, NightwatchEvent $latest, array $payload): string
    {
        return match ($type) {
            'outgoing-request' => (string) ($payload['host'] ?? $latest->title()),
            'cache-event' => (string) ($payload['key'] ?? $latest->title()),
            'mail' => (string) ($payload['class'] ?? $payload['subject'] ?? $latest->title()),
            'notification' => (string) ($payload['class'] ?? $latest->title()),
            default => $latest->title(),
        };
    }

    /**
     * @param  Collection<int, NightwatchEvent>  $requests
     * @return list<array{start: int, label: string, total: int, xx123: int, xx4: int, xx5: int, avg_us: float|null}>
     */
    private function requestBuckets(Collection $requests, TimeRange $range): array
    {
        $size = $range->bucketSeconds();
        $end = (int) now()->getTimestamp();
        $start = (int) $range->since();
        $firstBucket = intdiv($start, $size) * $size;
        $buckets = [];

        for ($cursor = $firstBucket; $cursor <= $end; $cursor += $size) {
            $buckets[$cursor] = [
                'start' => $cursor,
                'label' => $range->bucketLabel($cursor),
                'total' => 0,
                'xx123' => 0,
                'xx4' => 0,
                'xx5' => 0,
                'durations' => [],
            ];
        }

        foreach ($requests as $event) {
            $key = intdiv((int) $event->occurred_at, $size) * $size;
            if (! isset($buckets[$key])) {
                continue;
            }
            $family = $this->statusFamily($event->status_code);
            $buckets[$key]['total']++;
            $buckets[$key][$family]++;
            if ($event->duration_us !== null) {
                $buckets[$key]['durations'][] = (int) $event->duration_us;
            }
        }

        return array_values(array_map(function (array $bucket) {
            $durations = $bucket['durations'];
            unset($bucket['durations']);
            $bucket['avg_us'] = $durations === [] ? null : array_sum($durations) / count($durations);

            return $bucket;
        }, $buckets));
    }

    /**
     * @return array{total: int, handled: int, unhandled: int, users: int}
     */
    private function exceptionSnapshot(Environment $environment, TimeRange $range): array
    {
        $query = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType('exception')
            ->where('occurred_at', '>=', $range->since());

        $total = (clone $query)->count();
        $handled = (clone $query)->where('handled', true)->count();

        return [
            'total' => $total,
            'handled' => $handled,
            'unhandled' => $total - $handled,
            'users' => (int) (clone $query)->whereNotNull('user_id')->selectRaw('count(distinct user_id) as aggregate')->value('aggregate'),
        ];
    }

    /**
     * @return array{attempts: int, min_us: int|null, max_us: int|null}
     */
    private function jobSnapshot(Environment $environment, TimeRange $range): array
    {
        $row = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType('job-attempt')
            ->where('occurred_at', '>=', $range->since())
            ->selectRaw('count(*) as attempts, min(duration_us) as min_us, max(duration_us) as max_us')
            ->first();

        return [
            'attempts' => (int) ($row->attempts ?? 0),
            'min_us' => $row?->min_us !== null ? (int) $row->min_us : null,
            'max_us' => $row?->max_us !== null ? (int) $row->max_us : null,
        ];
    }

    /**
     * @return list<array{t: string, title: string, start: float, duration_us: int, event: null}>
     */
    private function stageSpans(NightwatchEvent $parent): array
    {
        $stages = match ($parent->t) {
            'request' => ['bootstrap', 'before_middleware', 'action', 'render', 'after_middleware', 'sending', 'terminating'],
            'command', 'job-attempt' => ['bootstrap', 'action', 'terminating'],
            default => [],
        };

        $cursor = (float) $parent->occurred_at;
        $spans = [];
        $payload = $parent->payload ?? [];

        foreach ($stages as $stage) {
            $us = is_numeric($payload[$stage] ?? null) ? (int) $payload[$stage] : 0;
            if ($us <= 0) {
                continue;
            }

            $spans[] = [
                't' => $stage,
                'title' => str_replace('_', ' ', $stage),
                'start' => $cursor,
                'duration_us' => $us,
                'event' => null,
            ];
            $cursor += $us / 1_000_000;
        }

        return $spans;
    }

    /**
     * @return list<string>
     */
    private function volumeKeys(string $type): array
    {
        return match ($type) {
            'request', 'outgoing-request' => ['xx123', 'xx4', 'xx5'],
            'exception' => ['handled', 'unhandled'],
            'command' => ['succeeded', 'failed'],
            'job-attempt' => ['processed', 'released', 'failed'],
            'scheduled-task' => ['processed', 'skipped', 'failed'],
            'cache-event' => ['hit', 'miss', 'write', 'delete', 'failures'],
            'mail', 'notification' => ['sent', 'failed'],
            'query' => ['ok'],
            default => [],
        };
    }

    private function volumeSegment(NightwatchEvent $event, string $type): ?string
    {
        return match ($type) {
            'request', 'outgoing-request' => $this->statusFamily($event->status_code),
            'exception' => $event->handled === true ? 'handled' : 'unhandled',
            'command' => (int) ($event->status_code ?? 0) === 0 ? 'succeeded' : 'failed',
            'job-attempt' => in_array($event->status, ['processed', 'failed', 'released'], true) ? $event->status : null,
            'scheduled-task' => in_array($event->status, ['processed', 'failed', 'skipped'], true) ? $event->status : null,
            'cache-event' => match ($event->status) {
                'hit', 'miss', 'write', 'delete' => $event->status,
                'write-failure', 'delete-failure' => 'failures',
                default => null,
            },
            'mail', 'notification' => $event->status === 'failed' ? 'failed' : 'sent',
            'query' => 'ok',
            default => null,
        };
    }

    private function statusFamily(?int $statusCode): string
    {
        $code = (int) $statusCode;

        if ($code >= 500) {
            return 'xx5';
        }

        if ($code >= 400) {
            return 'xx4';
        }

        return 'xx123';
    }
}
