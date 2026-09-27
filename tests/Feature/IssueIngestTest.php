<?php

namespace Tests\Feature;

use App\Models\Environment;
use App\Models\Issue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IssueIngestTest extends TestCase
{
    use RefreshDatabase;

    public function test_unhandled_exceptions_create_and_update_an_issue(): void
    {
        [, $environment] = $this->actingAsOwner();
        $group = str_repeat('e', 32);
        $this->ingestException($environment, $group, handled: false, user: '42');

        $this->assertDatabaseCount('issues', 1);
        $issue = Issue::query()->first();
        $this->assertSame(1, $issue->occurrences);
        $this->assertSame('open', $issue->status);
        $this->assertSame('RuntimeException', $issue->class);
        $this->assertSame(1, $issue->users_affected);
        $this->assertSame($environment->id, $issue->environment_id);

        $this->ingestException($environment, $group, handled: false, user: '99');

        $this->assertDatabaseCount('issues', 1);
        $issue->refresh();
        $this->assertSame(2, $issue->occurrences);
        $this->assertSame(2, $issue->users_affected);

        $this->get(route('issues.index', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/issues')
                ->where('issues.data.0.class', 'RuntimeException')
            );
        $this->get(route('issues.show', [$environment, $issue]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/issue')
                ->where('issue.occurrences', 2)
                ->where('exception.frames', [])
            );
        $this->get(route('exceptions.show', [$environment, $group]))->assertRedirect(route('issues.show', [
            'environment' => $environment,
            'issue' => $issue,
            'range' => '24h',
        ]));
    }

    public function test_issue_show_exposes_the_latest_stack_trace_details(): void
    {
        [, $environment] = $this->actingAsOwner();
        $group = str_repeat('f', 32);

        $trace = json_encode([
            [
                'file' => 'app/Services/Billing.php:42',
                'source' => '',
                'code' => ['41' => '    public function charge(): void', '42' => '        throw new RuntimeException("boom");'],
            ],
            [
                'file' => 'vendor/laravel/framework/src/Container.php:99',
                'source' => 'Container->call(...)',
                'code' => null,
            ],
        ], JSON_THROW_ON_ERROR);

        $this->ingestException($environment, $group, handled: false, user: '7', extra: [
            'trace' => $trace,
            'php_version' => '8.3.11',
            'laravel_version' => '12.1.0',
            'execution_source' => 'octane',
            'server' => 'web-1',
            'deploy' => 'a1b2c3d',
        ]);

        $issue = Issue::query()->first();

        $this->get(route('issues.show', [$environment, $issue]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/issue')
                ->where('exception.php_version', '8.3.11')
                ->where('exception.laravel_version', '12.1.0')
                ->where('exception.execution_source', 'octane')
                ->where('exception.server', 'web-1')
                ->where('exception.deploy', 'a1b2c3d')
                ->where('exception.user', '7')
                ->has('exception.frames', 2)
                ->where('exception.frames.0.file', 'app/Services/Billing.php:42')
                ->where('exception.frames.0.code.42', '        throw new RuntimeException("boom");')
                ->where('exception.frames.1.file', 'vendor/laravel/framework/src/Container.php:99')
                ->where('exception.frames.1.code', null)
            );
    }

    public function test_issues_index_lists_issues_outside_the_selected_range(): void
    {
        [, $environment] = $this->actingAsOwner();
        $this->travelTo('2026-09-26 12:00:00');
        $seen = (float) now()->subDays(30)->getTimestamp();

        Issue::factory()->recycle($environment)->create([
            'class' => 'OldException',
            'first_seen_at' => $seen,
            'last_seen_at' => $seen,
        ]);

        $this->get(route('issues.index', ['environment' => $environment, 'range' => '1h']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/issues')
                ->has('issues.data', 1)
                ->where('issues.data.0.class', 'OldException')
            );
    }

    public function test_handled_exceptions_do_not_create_issues(): void
    {
        [, $environment] = $this->actingAsOwner();
        $this->ingestException($environment, str_repeat('h', 32), handled: true);

        $this->assertDatabaseCount('nightwatch_events', 1);
        $this->assertDatabaseCount('issues', 0);
        $this->get(route('issues.index', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/issues')
                ->has('issues.data', 0)
            );
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function ingestException(Environment $environment, string $group, bool $handled, ?string $user = null, array $extra = []): void
    {
        $token = $this->ingestJwt($environment);

        $body = gzencode(json_encode([
            'records' => [array_merge([
                't' => 'exception',
                'timestamp' => now()->getTimestamp() + 0.1,
                'class' => 'RuntimeException',
                'message' => 'duplicate key',
                'code' => '0',
                'file' => 'app/Http/Controllers/DealController.php',
                'line' => 42,
                'handled' => $handled,
                'user' => $user ?? '',
                'trace_id' => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                '_group' => $group,
            ], $extra)],
        ], JSON_THROW_ON_ERROR));

        $this->call('POST', '/api/ingest', [], [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CONTENT_ENCODING' => 'gzip',
        ], $body)->assertOk();
    }
}
