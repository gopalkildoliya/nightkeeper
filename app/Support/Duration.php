<?php

namespace App\Support;

final class Duration
{
    public static function label(int|float|null $microseconds): string
    {
        if ($microseconds === null) {
            return '—';
        }

        $us = (int) round((float) $microseconds);

        if ($us < 1000) {
            return $us.' µs';
        }

        if ($us < 1_000_000) {
            return round($us / 1000, $us < 10_000 ? 1 : 0).' ms';
        }

        return number_format($us / 1_000_000, 2).' s';
    }
}
