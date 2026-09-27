<?php

namespace App\Http\Controllers;

use App\Actions\CreateWorkspace;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organizations = $user->organizations()
            ->with(['applications.environments' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get()
            ->map(function (Organization $organization) use ($user) {
                return [
                    ...$organization->toInertiaArray(),
                    'role' => $user->roleIn($organization)?->value,
                    'applications' => $organization->applications->map(fn ($application) => [
                        ...$application->toInertiaArray(),
                        'environments' => $application->environments->map->toInertiaArray()->values()->all(),
                    ])->values()->all(),
                ];
            });

        return Inertia::render('settings/organizations', [
            'organizations' => $organizations,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('settings/organization-create');
    }

    public function store(Request $request, CreateWorkspace $workspace): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);
        abort_unless($user->can('create', Organization::class), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $environment = $workspace->handle($user, $validated['name']);

        return redirect()->route('dashboard', $environment);
    }

    public function show(Request $request, Organization $organization): Response
    {
        abort_unless($request->user()?->can('view', $organization), 404);

        $organization->load(['users', 'applications.environments' => fn ($query) => $query->orderBy('name')]);

        return Inertia::render('settings/organization', [
            'organization' => $organization->toInertiaArray(),
            'is_owner' => $organization->isOwnedBy($request->user()),
            'members' => $organization->users
                ->sortBy('name')
                ->values()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                ])
                ->all(),
            'applications' => $organization->applications->map(fn ($application) => [
                ...$application->toInertiaArray(),
                'environments' => $application->environments->map->toInertiaArray()->values()->all(),
            ])->values()->all(),
        ]);
    }

    public function update(Request $request, Organization $organization): RedirectResponse
    {
        abort_unless($request->user()?->can('update', $organization), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $organization->update($validated);

        return back()->with('success', 'Organisation updated.');
    }
}
