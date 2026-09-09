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
}
