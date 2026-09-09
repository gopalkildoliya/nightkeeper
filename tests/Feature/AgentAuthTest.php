<?php

namespace Tests\Feature;

use App\Models\Environment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_issues_an_ingest_token(): void
    {
        $environment = Environment::factory()->create();

        $response = $this->postJson('/api/agent-auth', [], [
            'Authorization' => 'Bearer '.$environment->token,
            'nightwatch-server' => 'web-1',
        ]);

        $response->assertOk()
            ->assertJsonPath('expires_in', 3600)
            ->assertJsonPath('refresh_in', 3000);

        $this->assertIsString($response->json('token'));
        $this->assertNotSame('', $response->json('token'));
        $this->assertIsInt($response->json('expires_in'));
        $this->assertIsInt($response->json('refresh_in'));
        $this->assertLessThan($response->json('expires_in'), $response->json('refresh_in'));
        $this->assertStringStartsWith('http', $response->json('ingest_url'));
        $this->assertStringEndsWith('/api/ingest', $response->json('ingest_url'));
    }

    public function test_it_rejects_a_missing_or_wrong_token(): void
    {
        $this->postJson('/api/agent-auth')->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid environment token')
            ->assertJsonMissingPath('stop');

        $this->postJson('/api/agent-auth', [], [
            'Authorization' => 'Bearer not-the-token',
        ])->assertUnauthorized()->assertJsonMissingPath('stop');
    }
}
