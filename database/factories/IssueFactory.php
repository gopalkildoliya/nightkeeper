<?php

namespace Database\Factories;

use App\Models\Environment;
use App\Models\Issue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Issue>
 */
class IssueFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $seen = (float) now()->getTimestamp();

        return [
            'environment_id' => Environment::factory(),
            'group_hash' => substr(md5(fake()->unique()->uuid()), 0, 32),
            'class' => 'RuntimeException',
            'message' => 'sample boom',
            'file' => 'app/Http/Controllers/DealController.php',
            'line' => 42,
            'first_seen_at' => $seen,
            'last_seen_at' => $seen,
            'occurrences' => 1,
            'users_affected' => 1,
            'status' => 'open',
        ];
    }
}
