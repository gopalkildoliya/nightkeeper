<?php

namespace Tests\Feature;

use App\Models\NightwatchEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
