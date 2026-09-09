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
            );
        $this->get(route('exceptions.show', [$environment, $group]))->assertRedirect(route('issues.show', [
            'environment' => $environment,
            'issue' => $issue,
            'range' => '24h',
        ]));
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

    private function ingestException(Environment $environment, string $group, bool $handled, ?string $user = null): void
    {
        $token = $this->ingestJwt($environment);

        $body = gzencode(json_encode([
            'records' => [[
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
            ]],
        ], JSON_THROW_ON_ERROR));

        $this->call('POST', '/api/ingest', [], [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CONTENT_ENCODING' => 'gzip',
        ], $body)->assertOk();
    }
}
