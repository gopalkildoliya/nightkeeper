<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\Environment;
use App\Models\User;

class EnvironmentPolicy
{
    public function view(User $user, Environment $environment): bool
    {
        return $environment->application->organization->hasMember($user);
    }

    public function create(User $user, Application $application): bool
    {
        return $application->organization->isOwnedBy($user);
    }

    public function update(User $user, Environment $environment): bool
    {
        return $environment->application->organization->isOwnedBy($user);
    }

    public function delete(User $user, Environment $environment): bool
    {
        return $environment->application->organization->isOwnedBy($user);
    }

    public function viewToken(User $user, Environment $environment): bool
    {
        return $environment->application->organization->isOwnedBy($user);
    }

    public function rotateToken(User $user, Environment $environment): bool
    {
        return $environment->application->organization->isOwnedBy($user);
    }
}
