<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Environment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnvironmentController extends Controller
{
    public function store(Request $request, Application $application): RedirectResponse
    {
        abort_unless($request->user()?->can('create', [Environment::class, $application]), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $environment = $application->environments()->create([
            'name' => $validated['name'],
            'token' => Environment::generateToken(),
        ]);

        return redirect()->route('environments.settings', $environment)->with('success', 'Environment created.');
    }

    public function show(Request $request, Environment $environment): Response
    {
        $environment->load('application.organization');

        $canViewToken = $request->user()?->can('viewToken', $environment) ?? false;

        return Inertia::render('settings/environment', [
            'environment' => $environment->toInertiaArray(),
            'application' => $environment->application->toInertiaArray(),
            'organization' => $environment->application->organization->toInertiaArray(),
            'token' => $canViewToken ? $environment->makeVisible('token')->token : null,
            'can_update' => $request->user()?->can('update', $environment) ?? false,
            'can_rotate' => $request->user()?->can('rotateToken', $environment) ?? false,
            'base_url' => url('/'),
            'success' => $request->session()->get('success'),
        ]);
    }

    public function update(Request $request, Environment $environment): RedirectResponse
    {
        abort_unless($request->user()?->can('update', $environment), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $environment->update($validated);

        return back()->with('success', 'Environment updated.');
    }

    public function rotate(Request $request, Environment $environment): RedirectResponse
    {
        abort_unless($request->user()?->can('rotateToken', $environment), 404);

        $environment->rotateToken();

        return back()->with('success', 'Token rotated. Update NIGHTWATCH_TOKEN in your application.');
    }

    public function destroy(Request $request, Environment $environment): RedirectResponse
    {
        abort_unless($request->user()?->can('delete', $environment), 404);

        $organization = $environment->application->organization;
        $environment->delete();

        return redirect()->route('organizations.show', $organization)->with('success', 'Environment deleted.');
    }
}
