<?php

namespace Tests\Feature;

use App\Models\Environment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/login'));
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $environment = Environment::factory()->create();

        $this->get('/')->assertRedirect('/login');
        $this->get(route('dashboard', $environment))->assertRedirect('/login');
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/');
    }

    public function test_authenticated_home_redirects_to_an_environment_dashboard(): void
    {
        [, $environment] = $this->actingAsOwner();

        $this->get('/')->assertRedirect(route('dashboard', $environment));
    }

    public function test_users_without_environments_are_sent_to_organisations(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/')->assertRedirect(route('organizations.index'));
    }
}
