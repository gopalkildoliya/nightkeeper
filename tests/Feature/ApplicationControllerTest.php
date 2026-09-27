<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Application;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_owners_can_rename_their_application(): void
    {
        [, $environment] = $this->actingAsOwner();
        $application = $environment->application;
        $organization = $application->organization;

        $this->from(route('organizations.show', $organization))
            ->patch(route('applications.update', [$organization, $application]), [
                'name' => 'Billing API',
            ])
            ->assertRedirectBackWithoutErrors()
            ->assertSessionHas('success', 'Application updated.');

        $this->assertSame('Billing API', $application->fresh()->name);
    }

    public function test_members_cannot_rename_the_application(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $application = $environment->application;
        $organization = $application->organization;
        $member = User::factory()->create();
        $organization->users()->attach($member->id, [
            'role' => OrganizationRole::Member->value,
        ]);

        $this->actingAs($member)
            ->patch(route('applications.update', [$organization, $application]), [
                'name' => 'Hacked',
            ])
            ->assertNotFound();

        $this->assertSame($application->name, $application->fresh()->name);
    }

    public function test_outsiders_cannot_rename_another_organisations_application(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $application = $environment->application;
        $organization = $application->organization;

        $this->actingAs(User::factory()->create())
            ->patch(route('applications.update', [$organization, $application]), [
                'name' => 'Hacked',
            ])
            ->assertNotFound();

        $this->assertSame($application->name, $application->fresh()->name);
    }

    public function test_application_from_another_organisation_returns_404(): void
    {
        [, $environment] = $this->actingAsOwner();
        $organization = $environment->application->organization;
        $otherApplication = Application::factory()->create();

        $this->patch(route('applications.update', [$organization, $otherApplication]), [
            'name' => 'Hacked',
        ])->assertNotFound();

        $this->assertSame($otherApplication->name, $otherApplication->fresh()->name);
    }

    public function test_guests_are_redirected_to_login_when_renaming_an_application(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $application = $environment->application;
        $organization = $application->organization;

        $this->patch(route('applications.update', [$organization, $application]), [
            'name' => 'Hacked',
        ])->assertRedirect('/login');

        $this->assertSame($application->name, $application->fresh()->name);
    }

    public function test_application_name_is_required(): void
    {
        [, $environment] = $this->actingAsOwner();
        $application = $environment->application;
        $organization = $application->organization;
        $originalName = $application->name;

        $this->from(route('organizations.show', $organization))
            ->patch(route('applications.update', [$organization, $application]), [
                'name' => '',
            ])
            ->assertRedirectBackWithErrors(['name'])
            ->assertInvalid(['name' => 'The name field is required.']);

        $this->assertSame($originalName, $application->fresh()->name);
    }

    public function test_application_name_may_not_exceed_255_characters(): void
    {
        [, $environment] = $this->actingAsOwner();
        $application = $environment->application;
        $organization = $application->organization;
        $originalName = $application->name;

        $this->from(route('organizations.show', $organization))
            ->patch(route('applications.update', [$organization, $application]), [
                'name' => str_repeat('a', 256),
            ])
            ->assertRedirectBackWithErrors(['name'])
            ->assertInvalid(['name' => 'The name field must not be greater than 255 characters.']);

        $this->assertSame($originalName, $application->fresh()->name);
    }
}
