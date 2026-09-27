<?php

namespace App\Http\Middleware;

use App\Models\Application;
use App\Models\Environment;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use App\TimeRange;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $range = TimeRange::fromInput($request->query('range'));
        $user = $request->user();
        $environment = $request->route('environment');
        $current = $environment instanceof Environment ? $environment : null;
        $current?->loadMissing('application.organization');

        $switcher = $user === null ? [] : $this->switcher($user);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user === null ? null : [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'range' => $range->toArray(),
            'openIssueCount' => $current
                ? Issue::query()->where('environment_id', $current->id)->where('status', 'open')->count()
                : 0,
            'currentOrganization' => $current?->application->organization->toInertiaArray(),
            'currentApplication' => $current?->application->toInertiaArray(),
            'currentEnvironment' => $current?->toInertiaArray(),
            'isOwner' => $current !== null && $user !== null
                ? $current->application->organization->isOwnedBy($user)
                : false,
            'switcher' => $switcher,
            'flash' => [
                'success' => $request->session()->get('success'),
            ],
            'csrf_token' => csrf_token(),
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     name: string,
     *     applications: list<array{
     *         id: string,
     *         name: string,
     *         environments: list<array{id: string, name: string}>
     *     }>
     * }>
     */
    private function switcher(User $user): array
    {
        return $user->organizations()
            ->with([
                'applications' => fn ($query) => $query->orderBy('name'),
                'applications.environments' => fn ($query) => $query->orderBy('name'),
            ])
            ->orderBy('name')
            ->get()
            ->map(function (Organization $organization) {
                $applications = $organization->applications
                    ->map(fn (Application $application) => [
                        'id' => $application->id,
                        'name' => $application->name,
                        'environments' => $application->environments
                            ->map(fn (Environment $environment) => [
                                'id' => $environment->id,
                                'name' => $environment->name,
                            ])
                            ->values()
                            ->all(),
                    ])
                    ->filter(fn (array $application) => $application['environments'] !== [])
                    ->values()
                    ->all();

                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'applications' => $applications,
                ];
            })
            ->filter(fn (array $organization) => $organization['applications'] !== [])
            ->values()
            ->all();
    }
}
