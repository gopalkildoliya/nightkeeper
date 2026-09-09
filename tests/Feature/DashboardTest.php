<?php

namespace Tests\Feature;

use App\Models\NightwatchEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_dashboard_lists_ingested_requests(): void
    {
        [, $environment] = $this->actingAsOwner();
        $event = NightwatchEvent::factory()->recycle($environment)->request('/deals')->create();

        $this->get(route('dashboard', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/overview')
                ->where('name', 'Nightkeeper')
                ->has('duration.p95_label')
            );

        $this->get(route('requests', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('groups.data.0.label', 'GET /deals')
            );

        $this->get(route('traces.show', [$environment, $event->trace_id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/trace')
                ->where('parent.title', 'GET /deals')
            );
    }

    public function test_commands_page_groups_runs_with_success_and_failure_counts(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->command('inspire', 'inspire', 0, 12_000)->create([
            'occurred_at' => now()->getTimestamp() - 30,
        ]);
        NightwatchEvent::factory()->recycle($environment)->command('inspire', 'inspire', 0, 18_000)->create([
            'occurred_at' => now()->getTimestamp() - 20,
        ]);
        NightwatchEvent::factory()->recycle($environment)->command(
            'list',
            '',
            1,
            40_000,
            'Symfony\\Component\\Console\\Command\\ListCommand',
        )->create([
            'occurred_at' => now()->getTimestamp() - 10,
        ]);

        $this->get(route('commands', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'command')
                ->where('groups.data.0.label', 'inspire')
                ->where('groups.data.0.occurrences', 2)
                ->where('groups.data.0.counts.succeeded', 2)
                ->where('groups.data.0.counts.failed', 0)
                ->where('groups.data.0.avg_label', '15 ms')
                ->where('groups.data.1.label', 'list')
                ->where('groups.data.1.occurrences', 1)
                ->where('groups.data.1.counts.succeeded', 0)
                ->where('groups.data.1.counts.failed', 1)
                ->where('groups.data.1.meta.class', 'Symfony\\Component\\Console\\Command\\ListCommand')
            );
    }

    public function test_command_group_lists_executions_with_argv_exit_code_and_server(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();
        $event = NightwatchEvent::factory()->recycle($environment)->command(
            'tinker',
            'tinker --execute dump(1)',
            1,
            80_000,
            'Laravel\\Tinker\\Console\\TinkerCommand',
        )->create([
            'occurred_at' => now()->getTimestamp() - 5,
        ]);

        $this->get(route('commands.show', [$environment, $event->group_hash]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/group-events')
                ->where('heading', 'Command')
                ->where('group.label', 'tinker')
                ->where('group.counts.failed', 1)
                ->where('events.0.title', 'tinker')
                ->where('events.0.command_line', 'tinker --execute dump(1)')
                ->where('events.0.status_label', 'exit 1')
                ->where('events.0.is_error', true)
                ->where('events.0.server', 'web-1')
                ->where('events.0.queries', 2)
                ->where('events.0.peak_memory_label', '32 MB')
                ->where('events.0.class', 'Laravel\\Tinker\\Console\\TinkerCommand')
            );
    }

    public function test_jobs_page_charts_attempts_by_status_over_the_selected_range(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->jobAttempt('App\\Jobs\\SyncDeals', 'processed')->create([
            'occurred_at' => now()->getTimestamp() - 60,
        ]);
        NightwatchEvent::factory()->recycle($environment)->jobAttempt('App\\Jobs\\SyncDeals', 'failed')->create([
            'occurred_at' => now()->getTimestamp() - 90,
        ]);
        NightwatchEvent::factory()->recycle($environment)->jobAttempt('App\\Jobs\\SyncDeals', 'released')->create([
            'occurred_at' => now()->subHours(3)->getTimestamp(),
        ]);
        NightwatchEvent::factory()->recycle($environment)->jobAttempt('App\\Jobs\\SyncDeals', 'processed')->create([
            'occurred_at' => now()->subHours(30)->getTimestamp(),
        ]);

        $this->get(route('jobs', $environment).'?range=1h')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'job')
                ->where('groups.data.0.label', 'App\\Jobs\\SyncDeals')
                ->where('groups.data.0.counts.processed', 1)
                ->where('groups.data.0.counts.failed', 1)
                ->where('groups.data.0.counts.released', 0)
                ->has('buckets')
                ->where('buckets', function (Collection $buckets): bool {
                    return $this->segmentSum($buckets, 'processed') === 1
                        && $this->segmentSum($buckets, 'failed') === 1
                        && $this->segmentSum($buckets, 'released') === 0
                        && $buckets->sum('total') === 2;
                })
            );
    }

    public function test_requests_page_charts_volume_by_status_over_the_selected_range(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->request('/deals', 'GET', 200)->create([
            'occurred_at' => now()->getTimestamp() - 60,
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/deals', 'GET', 500)->create([
            'occurred_at' => now()->getTimestamp() - 90,
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/deals', 'GET', 404)->create([
            'occurred_at' => now()->subHours(3)->getTimestamp(),
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/old', 'GET', 200)->create([
            'occurred_at' => now()->subHours(30)->getTimestamp(),
        ]);

        $this->get(route('requests', $environment).'?range=1h')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'request')
                ->has('buckets')
                ->where('buckets', function (Collection $buckets): bool {
                    return $this->segmentSum($buckets, 'xx123') === 1
                        && $this->segmentSum($buckets, 'xx5') === 1
                        && $this->segmentSum($buckets, 'xx4') === 0
                        && $buckets->sum('total') === 2;
                })
            );
    }

    public function test_exceptions_page_charts_handled_and_unhandled_over_the_selected_range(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->unhandled()->create([
            'occurred_at' => now()->getTimestamp() - 60,
        ]);
        NightwatchEvent::factory()->recycle($environment)->handled()->create([
            'occurred_at' => now()->getTimestamp() - 90,
        ]);
        NightwatchEvent::factory()->recycle($environment)->unhandled()->create([
            'occurred_at' => now()->subHours(30)->getTimestamp(),
        ]);

        $this->get(route('exceptions', $environment).'?range=1h')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'exception')
                ->has('buckets')
                ->where('buckets', function (Collection $buckets): bool {
                    return $this->segmentSum($buckets, 'unhandled') === 1
                        && $this->segmentSum($buckets, 'handled') === 1
                        && $buckets->sum('total') === 2;
                })
            );
    }

    public function test_cache_page_charts_hits_misses_and_failures_over_the_selected_range(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->cacheEvent('users.1', 'hit')->create([
            'occurred_at' => now()->getTimestamp() - 60,
        ]);
        NightwatchEvent::factory()->recycle($environment)->cacheEvent('users.1', 'miss')->create([
            'occurred_at' => now()->getTimestamp() - 90,
        ]);
        NightwatchEvent::factory()->recycle($environment)->cacheEvent('users.1', 'write-failure')->create([
            'occurred_at' => now()->getTimestamp() - 120,
        ]);
        NightwatchEvent::factory()->recycle($environment)->cacheEvent('users.1', 'write')->create([
            'occurred_at' => now()->subHours(30)->getTimestamp(),
        ]);

        $this->get(route('cache', $environment).'?range=1h')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'cache')
                ->has('buckets')
                ->where('buckets', function (Collection $buckets): bool {
                    return $this->segmentSum($buckets, 'hit') === 1
                        && $this->segmentSum($buckets, 'miss') === 1
                        && $this->segmentSum($buckets, 'failures') === 1
                        && $this->segmentSum($buckets, 'write') === 0
                        && $buckets->sum('total') === 3;
                })
            );
    }

    public function test_scheduled_task_group_lists_runs_with_cron_status_and_server(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();
        $event = NightwatchEvent::factory()->recycle($environment)->scheduledTask(
            'inspire',
            'failed',
            80_000,
            '*/5 * * * *',
        )->create([
            'occurred_at' => now()->getTimestamp() - 5,
        ]);

        $this->get(route('scheduled-tasks.show', [$environment, $event->group_hash]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/group-events')
                ->where('heading', 'Scheduled task')
                ->where('group.label', 'inspire')
                ->where('group.counts.failed', 1)
                ->where('group.meta.cron', '*/5 * * * *')
                ->where('events.0.title', 'inspire')
                ->where('events.0.status_label', 'failed')
                ->where('events.0.is_error', true)
                ->where('events.0.cron', '*/5 * * * *')
                ->where('events.0.server', 'web-1')
                ->where('events.0.queries', 2)
                ->where('events.0.peak_memory_label', '16 MB')
            );
    }

    public function test_outgoing_request_group_lists_calls_with_status_and_trace(): void
    {
        [, $environment] = $this->actingAsOwner();
        $event = NightwatchEvent::factory()->recycle($environment)->outgoingRequest('api.stripe.com', 'GET', 502, 120_000)->create();

        $this->get(route('outgoing-requests.show', [$environment, $event->group_hash]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/group-events')
                ->where('heading', 'Outgoing request')
                ->where('group.label', 'api.stripe.com')
                ->where('group.counts.xx5', 1)
                ->where('events.0.title', 'GET https://api.stripe.com/v1/charges')
                ->where('events.0.status_label', '502')
                ->where('events.0.is_error', true)
            );
    }

    /**
     * @param  Collection<int, mixed>  $buckets
     */
    private function segmentSum(Collection $buckets, string $segment): int
    {
        return (int) $buckets->sum(fn (mixed $bucket): int => (int) data_get($bucket, 'segments.'.$segment));
    }
}
