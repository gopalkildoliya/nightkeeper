<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $lastId = $request->session()->get('last_environment_id');
        if (is_string($lastId) && $lastId !== '') {
            $last = $user->accessibleEnvironments()->whereKey($lastId)->first();
            if ($last instanceof Environment) {
                return redirect()->route('dashboard', $last);
            }
        }

        $environment = $user->accessibleEnvironments()->first();
        if ($environment instanceof Environment) {
            return redirect()->route('dashboard', $environment);
        }

        return redirect()->route('organizations.index');
    }
}
