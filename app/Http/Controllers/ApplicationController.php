<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Environment;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function store(Request $request, Organization $organization): RedirectResponse
    {
        abort_unless($request->user()?->can('create', [Application::class, $organization]), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $application = $organization->applications()->create($validated);
        $application->environments()->create([
            'name' => 'Production',
            'token' => Environment::generateToken(),
        ]);

        return redirect()->route('organizations.show', $organization)->with('success', 'Application created.');
    }

    public function update(Request $request, Organization $organization, Application $application): RedirectResponse
    {
        abort_unless($application->organization_id === $organization->id, 404);
        abort_unless($request->user()?->can('update', $application), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $application->update($validated);

        return back()->with('success', 'Application updated.');
    }

    public function destroy(Request $request, Organization $organization, Application $application): RedirectResponse
    {
        abort_unless($application->organization_id === $organization->id, 404);
        abort_unless($request->user()?->can('delete', $application), 404);

        $application->delete();

        return redirect()->route('organizations.show', $organization)->with('success', 'Application deleted.');
    }
}
