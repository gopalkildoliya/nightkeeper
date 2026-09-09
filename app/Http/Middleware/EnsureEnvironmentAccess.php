<?php

namespace App\Http\Middleware;

use App\Models\Environment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEnvironmentAccess
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $environment = $request->route('environment');

        if (! $environment instanceof Environment) {
            abort(404);
        }

        $user = $request->user();
        $environment->loadMissing('application.organization');

        if ($user === null || ! $environment->application->organization->hasMember($user)) {
            abort(404);
        }

        $request->session()->put('last_environment_id', $environment->id);

        return $next($request);
    }
}
