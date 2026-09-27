<?php

namespace Tests\Feature;

use App\Models\Environment;
use App\Models\Issue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IssueActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_close_and_reopen_issue(): void
    {
        [$user, $environment] = $this->actingAsOwner();

        // ingest an unhandled exception to create an issue
        $group = str_repeat('z', 32);
        $this->ingestException($environment, $group, handled: false);

        $issue = Issue::query()->first();
        $this->assertSame('open', $issue->status);

        $this->post(route('issues.close', [$environment, $issue]))->assertRedirect();
        $issue->refresh();
        $this->assertSame('closed', $issue->status);

        $this->post(route('issues.reopen', [$environment, $issue]))->assertRedirect();
        $issue->refresh();
        $this->assertSame('open', $issue->status);
    }

    public function test_non_member_cannot_close_issue(): void
    {
        [, $environment] = $this->actingAsOwner();
        $group = str_repeat('x', 32);
        $this->ingestException($environment, $group, handled: false);

        $issue = Issue::query()->first();

        // act as another user
        $other = User::factory()->create();
        $this->actingAs($other);

        $this->post(route('issues.close', [$environment, $issue]))->assertStatus(404);
    }

    private function ingestException(Environment $environment, string $group, bool $handled): void
    {
        $token = $this->ingestJwt($environment);

        $body = gzencode(json_encode([
            'records' => [[
                't' => 'exception',
                'timestamp' => now()->getTimestamp() + 0.1,
                'class' => 'RuntimeException',
                'message' => 'boom',
                'handled' => $handled,
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
