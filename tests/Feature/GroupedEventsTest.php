<?php

namespace Tests\Feature;

use App\Models\NightwatchEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GroupedEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_requests_are_grouped_by_route_with_count_and_p95(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();
        $group = substr(md5('GET|/deals'), 0, 32);

        NightwatchEvent::factory()->recycle($environment)->request('/deals', 'GET', 200, 40_000)->create([
            'group_hash' => $group,
            'occurred_at' => now()->getTimestamp() - 10,
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/deals', 'GET', 200, 80_000)->create([
            'group_hash' => $group,
            'occurred_at' => now()->getTimestamp() - 5,
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/health', 'GET', 200, 1_000)->create();

        $this->get(route('requests', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'request')
                ->has('groups.data', 2)
                ->where('groups.data.0.label', 'GET /deals')
                ->where('groups.data.0.occurrences', 2)
                ->where('groups.data.1.label', 'GET /health')
            );

        $this->get(route('requests.show', [$environment, $group]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/group-events')
                ->where('group.occurrences', 2)
            );
    }

    public function test_queries_and_jobs_are_grouped(): void
    {
        [, $environment] = $this->actingAsOwner();
        NightwatchEvent::factory()->recycle($environment)->query('select * from deals')->create();
        NightwatchEvent::factory()->recycle($environment)->query('select * from deals')->create();
        NightwatchEvent::factory()->recycle($environment)->jobAttempt('App\\Jobs\\SyncDeals')->create();
        NightwatchEvent::factory()->recycle($environment)->jobAttempt('App\\Jobs\\SyncDeals', 'failed', 200_000)->create();

        $this->get(route('queries', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'query')
                ->where('groups.data.0.label', 'select * from deals')
                ->where('groups.data.0.occurrences', 2)
            );

        $this->get(route('jobs', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'job')
                ->where('groups.data.0.label', 'App\\Jobs\\SyncDeals')
                ->where('groups.data.0.counts.failed', 1)
            );
    }

    public function test_exceptions_are_fingerprinted_and_trace_includes_request_stages(): void
    {
        [, $environment] = $this->actingAsOwner();
        $request = NightwatchEvent::factory()->recycle($environment)->request('/deals')->create();
        NightwatchEvent::factory()->recycle($environment)->query('select * from deals')->create([
            'trace_id' => $request->trace_id,
            'occurred_at' => $request->occurred_at + 0.01,
        ]);
        NightwatchEvent::factory()->recycle($environment)->unhandled()->create([
            'trace_id' => $request->trace_id,
            'occurred_at' => $request->occurred_at + 0.02,
        ]);

        $this->get(route('exceptions', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'exception')
                ->where('groups.data.0.meta.class', 'RuntimeException')
                ->where('groups.data.0.meta.message', 'sample boom')
            );

        $this->get(route('traces.show', [$environment, $request->trace_id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/trace')
                ->where('parent.title', 'GET /deals')
                ->where('spans', function ($spans): bool {
                    $titles = collect($spans)->pluck('title');

                    return $titles->contains('bootstrap')
                        && $titles->contains('action')
                        && $titles->contains('select * from deals');
                })
            );
    }

    public function test_outgoing_requests_are_grouped_by_host_with_status_counts(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->outgoingRequest('api.stripe.com', 'GET', 200)->create([
            'occurred_at' => now()->getTimestamp() - 20,
        ]);
        NightwatchEvent::factory()->recycle($environment)->outgoingRequest('api.stripe.com', 'POST', 500, 90_000)->create([
            'occurred_at' => now()->getTimestamp() - 10,
        ]);
        NightwatchEvent::factory()->recycle($environment)->outgoingRequest('api.github.com')->create();

        $this->get(route('outgoing-requests', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'outgoing-request')
                ->where('groups.data.0.label', 'api.stripe.com')
                ->where('groups.data.0.occurrences', 2)
                ->where('groups.data.0.counts.xx123', 1)
                ->where('groups.data.0.counts.xx5', 1)
                ->where('groups.data.1.label', 'api.github.com')
            );
    }

    public function test_cache_events_are_grouped_by_key_with_hit_and_miss_counts(): void
    {
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->cacheEvent('users.1', 'hit')->create();
        NightwatchEvent::factory()->recycle($environment)->cacheEvent('users.1', 'miss')->create();
        NightwatchEvent::factory()->recycle($environment)->cacheEvent('users.1', 'write-failure')->create();
        NightwatchEvent::factory()->recycle($environment)->cacheEvent('sessions.2', 'write')->create();

        $this->get(route('cache', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'cache')
                ->where('groups.data.0.label', 'users.1')
                ->where('groups.data.0.counts.hit', 1)
                ->where('groups.data.0.counts.miss', 1)
                ->where('groups.data.0.counts.failures', 1)
                ->where('groups.data.0.meta.store', 'redis')
                ->where('groups.data.1.label', 'sessions.2')
                ->where('groups.data.1.counts.write', 1)
            );
    }

    public function test_mail_and_notifications_are_grouped_by_class(): void
    {
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->mail()->create();
        NightwatchEvent::factory()->recycle($environment)->mail(failed: true)->create();
        NightwatchEvent::factory()->recycle($environment)->mail('App\\Mail\\Welcome')->create();
        NightwatchEvent::factory()->recycle($environment)->notification()->create();
        NightwatchEvent::factory()->recycle($environment)->notification('App\\Notifications\\DealSynced', 'slack', true)->create();

        $this->get(route('mail', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'mail')
                ->where('groups.data.0.label', 'App\\Mail\\DealSynced')
                ->where('groups.data.0.counts.sent', 1)
                ->where('groups.data.0.counts.failed', 1)
                ->where('groups.data.0.meta.subject', 'Deal synced')
                ->where('groups.data.1.label', 'App\\Mail\\Welcome')
            );

        $this->get(route('notifications', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'notification')
                ->where('groups.data.0.label', 'App\\Notifications\\DealSynced')
                ->where('groups.data.0.occurrences', 2)
                ->where('groups.data.0.counts.sent', 1)
                ->where('groups.data.0.counts.failed', 1)
            );
    }

    public function test_scheduled_tasks_are_grouped_with_processed_failed_and_skipped_counts(): void
    {
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->scheduledTask('inspire', 'processed')->create();
        NightwatchEvent::factory()->recycle($environment)->scheduledTask('inspire', 'failed', 80_000)->create();
        NightwatchEvent::factory()->recycle($environment)->scheduledTask('inspire', 'skipped', 0)->create();
        NightwatchEvent::factory()->recycle($environment)->scheduledTask('backup:run')->create();

        $this->get(route('scheduled-tasks', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/groups')
                ->where('kind', 'scheduled-task')
                ->where('groups.data.0.label', 'inspire')
                ->where('groups.data.0.occurrences', 3)
                ->where('groups.data.0.counts.processed', 1)
                ->where('groups.data.0.counts.failed', 1)
                ->where('groups.data.0.counts.skipped', 1)
                ->where('groups.data.0.meta.cron', '* * * * *')
                ->where('groups.data.1.label', 'backup:run')
            );
    }
}
