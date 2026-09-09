<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use App\Models\Issue;
use App\Models\NightwatchEvent;
use App\Services\DashboardMetrics;
use App\Support\Duration;
use App\TimeRange;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private DashboardMetrics $metrics) {}

    public function index(Request $request, Environment $environment): Response
    {
        $range = TimeRange::fromInput($request->query('range'));

        return Inertia::render('dashboard/overview', $this->metrics->overview($environment, $range));
    }

    public function requests(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'request', 'Requests');
    }

    public function requestGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'request', $groupHash, 'Request');
    }

    public function queries(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'query', 'Queries');
    }

    public function queryGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'query', $groupHash, 'Query');
    }

    public function jobs(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'job-attempt', 'Jobs');
    }

    public function jobGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'job-attempt', $groupHash, 'Job');
    }

    public function exceptions(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'exception', 'Exceptions');
    }

    public function exceptionGroup(Request $request, Environment $environment, string $groupHash): Response|RedirectResponse
    {
        $issue = Issue::query()
            ->where('environment_id', $environment->id)
            ->where('group_hash', $groupHash)
            ->first();
        if ($issue) {
            return redirect()->route('issues.show', [
                'environment' => $environment,
                'issue' => $issue,
                'range' => TimeRange::fromInput($request->query('range'))->value,
            ]);
        }

        return $this->groupShow($request, $environment, 'exception', $groupHash, 'Exception');
    }

    public function commands(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'command', 'Commands');
    }

    public function commandGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'command', $groupHash, 'Command');
    }

    public function scheduledTasks(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'scheduled-task', 'Scheduled tasks');
    }

    public function scheduledTaskGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'scheduled-task', $groupHash, 'Scheduled task');
    }

    public function outgoingRequests(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'outgoing-request', 'Outgoing requests');
    }

    public function outgoingRequestGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'outgoing-request', $groupHash, 'Outgoing request');
    }

    public function cache(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'cache-event', 'Cache');
    }

    public function cacheGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'cache-event', $groupHash, 'Cache');
    }

    public function mail(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'mail', 'Mail');
    }

    public function mailGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'mail', $groupHash, 'Mail');
    }

    public function notifications(Request $request, Environment $environment): Response
    {
        return $this->groupIndex($request, $environment, 'notification', 'Notifications');
    }

    public function notificationGroup(Request $request, Environment $environment, string $groupHash): Response
    {
        return $this->groupShow($request, $environment, 'notification', $groupHash, 'Notification');
    }

    public function trace(Environment $environment, string $traceId): Response
    {
        $events = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->where('trace_id', $traceId)
            ->orderBy('occurred_at')
            ->get();

        abort_if($events->isEmpty(), 404);

        $parent = $events->first(fn (NightwatchEvent $event) => in_array($event->t, ['request', 'command', 'scheduled-task', 'job-attempt'], true))
            ?? $events->first();

        $spans = $this->metrics->traceSpans($events, $parent);
        $start = (float) collect($spans)->min('start');
        $end = collect($spans)->max(fn (array $span) => $span['start'] + ($span['duration_us'] / 1_000_000));
        $window = max($end - $start, 0.001);

        return Inertia::render('dashboard/trace', [
            'traceId' => $traceId,
            'event_count' => $events->count(),
            'parent' => $parent->toDashboardArray(includePayload: true),
            'spans' => collect($spans)->map(function (array $item) use ($start, $window) {
                return [
                    't' => $item['t'],
                    'title' => $item['title'],
                    'duration_us' => $item['duration_us'],
                    'duration_label' => Duration::label($item['duration_us'] ?: null),
                    'kind' => $item['event'] ? 'child-'.$item['t'] : 'stage',
                    'left' => (($item['start'] - $start) / $window) * 100,
                    'width' => max(($item['duration_us'] / 1_000_000 / $window) * 100, 0.8),
                ];
            })->values()->all(),
        ]);
    }

    private function groupIndex(Request $request, Environment $environment, string $type, string $heading): Response
    {
        $range = TimeRange::fromInput($request->query('range'));
        $groups = $this->metrics->groups($environment, $type, $range);

        return Inertia::render('dashboard/groups', [
            'heading' => $heading,
            'kind' => $this->kind($type),
            'groups' => $this->paginate($groups, $request),
            'buckets' => $this->metrics->volumeBuckets($environment, $type, $range),
        ]);
    }

    private function groupShow(Request $request, Environment $environment, string $type, string $groupHash, string $heading): Response
    {
        $range = TimeRange::fromInput($request->query('range'));
        $events = $this->metrics->occurrences($environment, $type, $groupHash, $range);
        abort_if($events->isEmpty(), 404);

        $groups = $this->metrics->groups($environment, $type, $range);
        $group = $groups->first(fn ($item) => $item->groupHash === $groupHash);

        return Inertia::render('dashboard/group-events', [
            'heading' => $heading,
            'group' => $group?->toArray(),
            'events' => $events->map(fn (NightwatchEvent $event) => $event->toDashboardArray())->values(),
        ]);
    }

    /**
     * @param  Collection<int, mixed>  $items
     * @return LengthAwarePaginator<int, mixed>
     */
    private function paginate(Collection $items, Request $request): LengthAwarePaginator
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = 50;

        return new LengthAwarePaginator(
            $items->forPage($page, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );
    }

    private function kind(string $type): string
    {
        return match ($type) {
            'job-attempt' => 'job',
            'cache-event' => 'cache',
            default => $type,
        };
    }
}
