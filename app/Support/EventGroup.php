<?php

namespace App\Support;

use Illuminate\Contracts\Support\Arrayable;

/**
 * @implements Arrayable<string, mixed>
 */
final readonly class EventGroup implements Arrayable
{
    /**
     * @param  array<string, int>  $counts
     * @param  array<string, mixed>  $meta
     */
    public function __construct(
        public string $groupHash,
        public string $label,
        public int $occurrences,
        public ?float $avgUs,
        public ?float $p95Us,
        public ?int $maxUs,
        public ?int $minUs,
        public float $lastSeenAt,
        public array $counts,
        public int $usersAffected,
        public ?string $sampleTraceId,
        public array $meta = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'group_hash' => $this->groupHash,
            'label' => $this->label,
            'occurrences' => $this->occurrences,
            'avg_us' => $this->avgUs,
            'p95_us' => $this->p95Us,
            'max_us' => $this->maxUs,
            'min_us' => $this->minUs,
            'avg_label' => Duration::label($this->avgUs),
            'p95_label' => Duration::label($this->p95Us),
            'max_label' => Duration::label($this->maxUs),
            'min_label' => Duration::label($this->minUs),
            'last_seen_at' => $this->lastSeenAt,
            'last_seen_label' => gmdate('Y-m-d H:i:s', (int) $this->lastSeenAt).' UTC',
            'counts' => $this->counts,
            'users_affected' => $this->usersAffected,
            'sample_trace_id' => $this->sampleTraceId,
            'meta' => $this->meta,
        ];
    }
}
