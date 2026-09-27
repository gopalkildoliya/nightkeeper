<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_owners_can_rename_their_organisation(): void
    {
        [, $environment] = $this->actingAsOwner();
        $organization = $environment->application->organization;
        $originalSlug = $organization->slug;

        $this->from(route('organizations.show', $organization))
            ->patch(route('organizations.update', $organization), [
                'name' => 'Acme Monitoring',
                'slug' => 'hacked-slug',
            ])
            ->assertRedirectBackWithoutErrors()
            ->assertSessionHas('success', 'Organisation updated.');

        $organization->refresh();
        $this->assertSame('Acme Monitoring', $organization->name);
        $this->assertSame($originalSlug, $organization->slug);
    }

    public function test_members_cannot_rename_the_organisation(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $organization = $environment->application->organization;
        $member = User::factory()->create();
        $organization->users()->attach($member->id, [
            'role' => OrganizationRole::Member->value,
        ]);

        $this->actingAs($member)
            ->patch(route('organizations.update', $organization), [
                'name' => 'Hacked',
            ])
            ->assertNotFound();

        $this->assertSame($organization->name, $organization->fresh()->name);
    }

    public function test_outsiders_cannot_rename_another_organisation(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $organization = $environment->application->organization;

        $this->actingAs(User::factory()->create())
            ->patch(route('organizations.update', $organization), [
                'name' => 'Hacked',
            ])
            ->assertNotFound();

        $this->assertSame($organization->name, $organization->fresh()->name);
    }

    public function test_guests_are_redirected_to_login_when_renaming_an_organisation(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $organization = $environment->application->organization;

        $this->patch(route('organizations.update', $organization), [
            'name' => 'Hacked',
        ])->assertRedirect('/login');

        $this->assertSame($organization->name, $organization->fresh()->name);
    }

    public function test_organisation_name_is_required(): void
    {
        [, $environment] = $this->actingAsOwner();
        $organization = $environment->application->organization;
        $originalName = $organization->name;

        $this->from(route('organizations.show', $organization))
            ->patch(route('organizations.update', $organization), [
                'name' => '',
            ])
            ->assertRedirectBackWithErrors(['name'])
            ->assertInvalid(['name' => 'The name field is required.']);

        $this->assertSame($originalName, $organization->fresh()->name);
    }

    public function test_organisation_name_may_not_exceed_255_characters(): void
    {
        [, $environment] = $this->actingAsOwner();
        $organization = $environment->application->organization;
        $originalName = $organization->name;

        $this->from(route('organizations.show', $organization))
            ->patch(route('organizations.update', $organization), [
                'name' => str_repeat('a', 256),
            ])
            ->assertRedirectBackWithErrors(['name'])
            ->assertInvalid(['name' => 'The name field must not be greater than 255 characters.']);

        $this->assertSame($originalName, $organization->fresh()->name);
    }
}
