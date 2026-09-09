<?php

namespace Tests\Feature;

use App\Models\NightwatchEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_overview_shows_volume_status_and_p95_for_the_selected_range(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->request('/deals', 'GET', 200, 45_000)->create([
            'occurred_at' => now()->getTimestamp() - 60,
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/deals', 'GET', 500, 3_000_000)->create([
            'occurred_at' => now()->getTimestamp() - 120,
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/old', 'GET', 200, 10_000)->create([
            'occurred_at' => now()->subHours(30)->getTimestamp(),
        ]);
        NightwatchEvent::factory()->recycle($environment)->exception()->create([
            'occurred_at' => now()->getTimestamp() - 30,
        ]);
        NightwatchEvent::factory()->recycle($environment)->handled()->create([
            'occurred_at' => now()->getTimestamp() - 30,
        ]);
        NightwatchEvent::factory()->recycle($environment)->jobAttempt()->create([
            'occurred_at' => now()->getTimestamp() - 10,
        ]);

        $this->get(route('dashboard', $environment).'?range=24h')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/overview')
                ->where('range.value', '24h')
                ->where('duration.max_label', '3.00 s')
                ->where('status.xx5', 1)
                ->has('slow_routes', 1)
                ->where('slow_routes.0.label', 'GET /deals')
                ->where('slow_routes.0.max_label', '3.00 s')
                ->where('exceptions.unhandled', 1)
                ->where('jobs.attempts', 1)
            );
    }

    public function test_one_hour_range_hides_older_requests(): void
    {
        $this->travelTo(now());
        [, $environment] = $this->actingAsOwner();

        NightwatchEvent::factory()->recycle($environment)->request('/recent', 'GET', 200, 3_000_000)->create([
            'occurred_at' => now()->getTimestamp() - 60,
        ]);
        NightwatchEvent::factory()->recycle($environment)->request('/stale', 'GET', 200, 3_000_000)->create([
            'occurred_at' => now()->subHours(3)->getTimestamp(),
        ]);

        $this->get(route('dashboard', $environment).'?range=1h')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/overview')
                ->has('slow_routes', 1)
                ->where('slow_routes.0.label', 'GET /recent')
            );
    }
}
