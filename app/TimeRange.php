<?php

namespace App;

enum TimeRange: string
{
    case OneHour = '1h';
    case TwentyFourHours = '24h';
    case SevenDays = '7d';

    public static function fromInput(?string $value): self
    {
        return self::tryFrom((string) $value) ?? self::TwentyFourHours;
    }

    public function label(): string
    {
        return match ($this) {
            self::OneHour => '1H',
            self::TwentyFourHours => '24H',
            self::SevenDays => '7D',
        };
    }

    /**
     * @return array{value: string, label: string}
     */
    public function toArray(): array
    {
        return [
            'value' => $this->value,
            'label' => $this->label(),
        ];
    }

    public function seconds(): int
    {
        return match ($this) {
            self::OneHour => 3600,
            self::TwentyFourHours => 86400,
            self::SevenDays => 604800,
        };
    }

    public function since(): float
    {
        return (float) now()->subSeconds($this->seconds())->getTimestamp();
    }

    public function bucketSeconds(): int
    {
        return match ($this) {
            self::OneHour => 300,
            self::TwentyFourHours => 3600,
            self::SevenDays => 86400,
        };
    }

    public function bucketLabel(int $start): string
    {
        return match ($this) {
            self::OneHour => gmdate('H:i', $start),
            self::TwentyFourHours => gmdate('H:i', $start),
            self::SevenDays => gmdate('M j', $start),
        };
    }
}
