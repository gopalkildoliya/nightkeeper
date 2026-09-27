<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Environment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EnvironmentSwitcherTest extends TestCase
{
    use RefreshDatabase;

    public function test_switcher_nests_environments_under_applications_in_each_organisation(): void
    {
        [$user, $production] = $this->actingAsOwner();
        $application = $production->application;

        Environment::factory()->recycle($application)->create([
            'name' => 'Staging',
        ]);

        $billing = Application::factory()->recycle($application->organization)->create([
            'name' => 'Billing',
        ]);
        $billingProduction = Environment::factory()->recycle($billing)->create([
            'name' => 'Production',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard', $production))
            ->assertInertia(fn (Assert $page) => $page
                ->has('switcher', 1)
                ->where('switcher.0.id', $application->organization->id)
                ->where('switcher.0.name', $application->organization->name)
                ->has('switcher.0.applications', 2)
                ->where('switcher.0.applications.0.id', $billing->id)
                ->where('switcher.0.applications.0.name', 'Billing')
                ->has('switcher.0.applications.0.environments', 1)
                ->where('switcher.0.applications.0.environments.0.id', $billingProduction->id)
                ->where('switcher.0.applications.1.id', $application->id)
                ->where('switcher.0.applications.1.name', 'Default')
                ->has('switcher.0.applications.1.environments', 2)
                ->where('switcher.0.applications.1.environments.0.id', $production->id)
                ->where('switcher.0.applications.1.environments.0.name', 'Production')
                ->where('switcher.0.applications.1.environments.1.name', 'Staging')
            );
    }

    public function test_switcher_does_not_include_organisations_the_user_does_not_belong_to(): void
    {
        [$user, $environment] = $this->actingAsOwner();
        $this->createWorkspaceFor(User::factory()->create());

        $this->actingAs($user)
            ->get(route('dashboard', $environment))
            ->assertInertia(fn (Assert $page) => $page
                ->has('switcher', 1)
                ->where('switcher.0.id', $environment->application->organization->id)
                ->where('switcher.0.applications.0.environments.0.id', $environment->id)
            );
    }
}
