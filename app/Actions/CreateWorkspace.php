<?php

namespace App\Actions;

use App\Enums\OrganizationRole;
use App\Models\Environment;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateWorkspace
{
    public function handle(User $user, string $name): Environment
    {
        return DB::transaction(function () use ($user, $name) {
            $organization = Organization::query()->create([
                'name' => $name,
                'slug' => $this->uniqueSlug($name),
            ]);

            $organization->users()->attach($user->id, [
                'role' => OrganizationRole::Owner->value,
            ]);

            $application = $organization->applications()->create([
                'name' => 'Default',
            ]);

            return $application->environments()->create([
                'name' => 'Production',
                'token' => Environment::generateToken(),
            ]);
        });
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'organisation';
        $slug = $base;
        $suffix = 2;

        while (Organization::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
