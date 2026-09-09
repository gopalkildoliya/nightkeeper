<?php

namespace App\Http\Controllers;

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrganizationMemberController extends Controller
{
    public function store(Request $request, Organization $organization): RedirectResponse
    {
        abort_unless($request->user()?->can('update', $organization), 404);

        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $validated['email'])->first();
        if ($user === null) {
            return back()->withErrors(['email' => 'No user with that email exists.']);
        }

        if ($organization->hasMember($user)) {
            return back()->withErrors(['email' => 'That user is already a member.']);
        }

        $organization->users()->attach($user->id, [
            'role' => OrganizationRole::Member->value,
        ]);

        return back()->with('success', 'Member added.');
    }

    public function destroy(Request $request, Organization $organization, User $user): RedirectResponse
    {
        abort_unless($request->user()?->can('update', $organization), 404);

        if ($user->is($request->user())) {
            return back()->withErrors(['email' => 'You cannot remove yourself.']);
        }

        $organization->users()->detach($user->id);

        return back()->with('success', 'Member removed.');
    }
}
