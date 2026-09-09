<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\NightwatchEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenancyIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_can_view_their_environment_dashboard(): void
    {
        $owner = User::factory()->create();
        $environment = $this->createWorkspaceFor($owner);
        $member = User::factory()->create();
        $environment->application->organization->users()->attach($member->id, [
            'role' => OrganizationRole::Member->value,
        ]);

        $this->actingAs($member)
            ->get(route('dashboard', $environment))
            ->assertOk();
    }

    public function test_members_cannot_view_another_organisations_environment(): void
    {
        $ownerA = User::factory()->create();
        $environmentA = $this->createWorkspaceFor($ownerA);
        $ownerB = User::factory()->create();
        $environmentB = $this->createWorkspaceFor($ownerB);

        $event = NightwatchEvent::factory()->recycle($environmentB)->request('/secret')->create();
        $member = User::factory()->create();
        $environmentA->application->organization->users()->attach($member->id, [
            'role' => OrganizationRole::Member->value,
        ]);

        $this->actingAs($member)
            ->get(route('dashboard', $environmentB))
            ->assertNotFound();
        $this->actingAs($member)
            ->get(route('requests', $environmentB))
            ->assertNotFound();
        $this->actingAs($member)
            ->get(route('issues.index', $environmentB))
            ->assertNotFound();
        $this->actingAs($member)
            ->get(route('traces.show', [$environmentB, $event->trace_id]))
            ->assertNotFound();
        $this->actingAs($ownerA)
            ->get(route('dashboard', $environmentB))
            ->assertNotFound();
    }
}
