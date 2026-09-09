<?php

namespace Tests\Feature;

use App\Models\Environment;
use App\Models\NightwatchEvent;
use App\Services\IngestJwt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class IngestTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_stores_records_from_a_gzip_batch(): void
    {
        $environment = Environment::factory()->create();
        $token = $this->ingestJwt($environment);
        $body = gzencode(json_encode([
            'records' => [
                [
                    't' => 'request',
                    'timestamp' => 1757180000.1,
                    'method' => 'GET',
                    'route_path' => '/deals',
                    'status_code' => 200,
                    'duration' => 45000,
                    'trace_id' => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                    '_group' => str_repeat('a', 32),
                    'server' => 'web-1',
                ],
            ],
        ], JSON_THROW_ON_ERROR));

        $response = $this->call('POST', '/api/ingest', [], [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CONTENT_ENCODING' => 'gzip',
            'HTTP_NIGHTWATCH_SERVER' => 'web-1',
        ], $body);

        $response->assertOk()->assertExactJson([]);
        $this->assertDatabaseCount('nightwatch_events', 1);
        $event = NightwatchEvent::query()->first();
        $this->assertSame('request', $event->t);
        $this->assertSame('GET /deals', $event->title());
        $this->assertSame(200, $event->payload['status_code']);
        $this->assertSame(45000, $event->duration_us);
        $this->assertSame($environment->id, $event->environment_id);
    }

    public function test_ingest_from_one_environment_cannot_write_into_another(): void
    {
        $environmentA = Environment::factory()->create();
        $environmentB = Environment::factory()->create();
        $token = $this->ingestJwt($environmentA);
        $body = gzencode(json_encode([
            'records' => [[
                't' => 'request',
                'timestamp' => 1757180000.1,
                'method' => 'GET',
                'route_path' => '/deals',
                'status_code' => 200,
                'duration' => 45000,
            ]],
        ], JSON_THROW_ON_ERROR));

        $this->call('POST', '/api/ingest', [], [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CONTENT_ENCODING' => 'gzip',
        ], $body)->assertOk();

        $this->assertSame(1, NightwatchEvent::query()->where('environment_id', $environmentA->id)->count());
        $this->assertSame(0, NightwatchEvent::query()->where('environment_id', $environmentB->id)->count());
    }

    public function test_it_rejects_a_jwt_for_an_unknown_environment(): void
    {
        $token = app(IngestJwt::class)->sign(
            'test-ingest-signing-key',
            'web-1',
            (string) Str::uuid(),
        );

        $this->withToken($token)
            ->postJson('/api/ingest')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Unauthenticated')
            ->assertJsonMissingPath('stop');
    }

    public function test_it_rejects_a_bad_ingest_token_without_stop(): void
    {
        $response = $this->postJson('/api/ingest', [], [
            'Authorization' => 'Bearer not-a-jwt',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'Unauthenticated')
            ->assertJsonMissingPath('stop');
    }

    public function test_it_rejects_an_expired_ingest_token(): void
    {
        $environment = Environment::factory()->create();
        $token = app(IngestJwt::class)->sign(
            'test-ingest-signing-key',
            'web-1',
            $environment->id,
            now()->subHours(2)->getTimestampMs(),
        );

        $this->withToken($token)
            ->postJson('/api/ingest')
            ->assertUnauthorized()
            ->assertJsonMissingPath('stop');
    }
}
