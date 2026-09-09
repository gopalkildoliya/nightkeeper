<?php

namespace App\Models;

use Database\Factories\IssueFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'environment_id',
    'group_hash',
    'class',
    'message',
    'file',
    'line',
    'first_seen_at',
    'last_seen_at',
    'occurrences',
    'users_affected',
    'status',
])]
class Issue extends Model
{
    /** @use HasFactory<IssueFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'first_seen_at' => 'float',
            'last_seen_at' => 'float',
            'occurrences' => 'integer',
            'users_affected' => 'integer',
            'line' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Environment, $this>
     */
    public function environment(): BelongsTo
    {
        return $this->belongsTo(Environment::class);
    }

    /**
     * @return HasMany<NightwatchEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(NightwatchEvent::class, 'group_hash', 'group_hash')
            ->where('environment_id', $this->environment_id);
    }

    public function lastSeenLabel(): string
    {
        return gmdate('Y-m-d H:i:s', (int) $this->last_seen_at).' UTC';
    }

    public function firstSeenLabel(): string
    {
        return gmdate('Y-m-d H:i:s', (int) $this->first_seen_at).' UTC';
    }

    /**
     * @return array<string, mixed>
     */
    public function toDashboardArray(): array
    {
        return [
            'id' => $this->id,
            'class' => $this->class,
            'message' => $this->message,
            'file' => $this->file,
            'line' => $this->line,
            'occurrences' => $this->occurrences,
            'users_affected' => $this->users_affected,
            'status' => $this->status,
            'first_seen_label' => $this->firstSeenLabel(),
            'last_seen_label' => $this->lastSeenLabel(),
            'group_hash' => $this->group_hash,
        ];
    }
}
