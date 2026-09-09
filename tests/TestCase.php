<?php

namespace Tests;

use App\Actions\CreateWorkspace;
use App\Models\Environment;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    /**
     * @return array{0: User, 1: Environment}
     */
    protected function actingAsOwner(): array
    {
        $user = User::factory()->create();
        $environment = $this->createWorkspaceFor($user);
        $this->actingAs($user);

        return [$user, $environment];
    }

    protected function createWorkspaceFor(User $user): Environment
    {
        return app(CreateWorkspace::class)->handle($user, $user->name."'s organisation");
    }

    protected function ingestJwt(Environment $environment): string
    {
        $response = $this->postJson('/api/agent-auth', [], [
            'Authorization' => 'Bearer '.$environment->token,
            'nightwatch-server' => 'web-1',
        ]);

        $response->assertOk();

        return $response->json('token');
    }
}
