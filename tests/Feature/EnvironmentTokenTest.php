<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EnvironmentTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_owners_can_view_and_rotate_the_plaintext_token(): void
    {
        [, $environment] = $this->actingAsOwner();
        $original = $environment->token;

        $this->get(route('environments.settings', $environment))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/environment')
                ->where('token', $original)
            );

        $this->post(route('environments.token.rotate', $environment))->assertRedirect();

        $environment->refresh();
        $this->assertNotSame($original, $environment->token);
        $this->assertSame(44, strlen($environment->token));

        $this->postJson('/api/agent-auth', [], [
            'Authorization' => 'Bearer '.$original,
        ])->assertUnauthorized()->assertJsonMissingPath('stop');

        $this->postJson('/api/agent-auth', [], [
            'Authorization' => 'Bearer '.$environment->token,
            'nightwatch-server' => 'web-1',
        ])->assertOk();
    }

    public function test_members_cannot_view_or_rotate_the_token(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $member = User::factory()->create();
        $environment->application->organization->users()->attach($member->id, [
            'role' => OrganizationRole::Member->value,
        ]);

        $original = $environment->token;

        $this->actingAs($member)
            ->get(route('environments.settings', $environment))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/environment')
                ->where('token', null)
            );

        $this->actingAs($member)
            ->post(route('environments.token.rotate', $environment))
            ->assertNotFound();

        $this->assertSame($original, $environment->fresh()->token);
    }
}
