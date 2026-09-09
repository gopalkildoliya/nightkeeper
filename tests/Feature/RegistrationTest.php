<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_shares_the_session_csrf_token(): void
    {
        $this->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register')
                ->where('csrf_token', session()->token())
            );
    }

    public function test_new_users_are_registered_with_a_workspace(): void
    {
        $this->post('/register', [
            'name' => 'Taylor Otwell',
            'email' => 'taylor@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/');

        $user = User::query()->where('email', 'taylor@example.com')->first();
        $this->assertNotNull($user);

        $organization = $user->organizations()->first();
        $this->assertNotNull($organization);
        $this->assertSame("Taylor Otwell's organisation", $organization->name);
        $this->assertSame(OrganizationRole::Owner, $user->roleIn($organization));

        $environment = $user->accessibleEnvironments()->with('application')->first();
        $this->assertNotNull($environment);
        $this->assertSame('Default', $environment->application->name);
        $this->assertSame('Production', $environment->name);
        $this->assertSame(44, strlen($environment->makeVisible('token')->token));

        $this->actingAs($user)->get('/')->assertRedirect(route('dashboard', $environment));
    }
}
