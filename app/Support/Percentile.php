<?php

namespace App\Support;

final class Percentile
{
    /**
     * @param  list<int|float>  $values
     */
    public static function nearestRank(array $values, float $percentile): ?float
    {
        if ($values === []) {
            return null;
        }

        sort($values, SORT_NUMERIC);
        $index = (int) ceil($percentile / 100 * count($values)) - 1;

        return (float) $values[max(0, $index)];
    }
}
