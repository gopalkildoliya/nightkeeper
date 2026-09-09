<?php

namespace App\Models;

use App\Enums\OrganizationRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * @return BelongsToMany<Organization, $this>
     */
    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function roleIn(Organization $organization): ?OrganizationRole
    {
        $role = $this->organizations()
            ->where('organizations.id', $organization->id)
            ->first()
            ?->pivot
            ->role;

        return is_string($role) ? OrganizationRole::tryFrom($role) : null;
    }

    /**
     * @return Builder<Environment>
     */
    public function accessibleEnvironments(): Builder
    {
        return Environment::query()
            ->whereHas(
                'application.organization.users',
                fn (Builder $query) => $query->where('users.id', $this->id),
            )
            ->orderBy('name');
    }
}
