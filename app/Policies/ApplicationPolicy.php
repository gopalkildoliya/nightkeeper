<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\Organization;
use App\Models\User;

class ApplicationPolicy
{
    public function view(User $user, Application $application): bool
    {
        return $application->organization->hasMember($user);
    }

    public function create(User $user, Organization $organization): bool
    {
        return $organization->isOwnedBy($user);
    }

    public function update(User $user, Application $application): bool
    {
        return $application->organization->isOwnedBy($user);
    }

    public function delete(User $user, Application $application): bool
    {
        return $application->organization->isOwnedBy($user);
    }
}
