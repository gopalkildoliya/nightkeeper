import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    axisLabelInterval,
    chartTickSeconds,
    formatAxisLabel,
    shouldShowAxisLabel,
} from '@/lib/chart-ticks';

export type BarChartSegment = {
    key: string;
    label: string;
    barClass: string;
    swatchClass: string;
};

export type BarChartPoint = {
    start: number;
    label: string;
    total: number;
    values: Record<string, number>;
};

export function StackedBarChart({
    points,
    segments,
    ariaLabel,
    formatTotal = (value: number) => value.toLocaleString(),
    totalNoun,
}: {
    points: BarChartPoint[];
    segments: BarChartSegment[];
    ariaLabel: string;
    formatTotal?: (value: number) => string;
    totalNoun?: string;
}) {
    const maxTotal = Math.max(1, ...points.map((point) => point.total));
    const tickSeconds = chartTickSeconds(points.map((point) => point.start));
    const labelInterval = axisLabelInterval(tickSeconds);
    const dense = points.length > 40;
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="flex flex-col gap-1 overflow-visible">
            <div
                className={cn(
                    'flex h-32 items-end overflow-visible',
                    dense ? 'gap-px' : 'gap-1',
                )}
                aria-label={ariaLabel}
            >
                {points.map((point, index) => {
                    const height = (point.total / maxTotal) * 100;
                    const tooltipAlign =
                        index < 4
                            ? 'left-0'
                            : index > points.length - 5
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2';

                    return (
                        <div
                            key={point.start}
                            className="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-end rounded-sm hover:bg-muted/40"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div
                                className={cn(
                                    'pointer-events-none absolute bottom-full z-30 mb-1.5 w-max',
                                    hoveredIndex === index ? 'block' : 'hidden',
                                    tooltipAlign,
                                )}
                                role="tooltip"
                            >
                                <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-popover-foreground shadow-md">
                                    <div className="font-mono text-[11px] font-semibold text-foreground">
                                        {point.label}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                                        {formatTotal(point.total)}
                                        {totalNoun ? ` ${totalNoun}` : ''}
                                    </div>
                                    {segments.length > 1 ? (
                                        <div className="mt-1.5 flex flex-col gap-0.5">
                                            {segments.map((segment) => (
                                                <div
                                                    key={segment.key}
                                                    className="flex items-center gap-1.5 font-mono text-[11px]"
                                                >
                                                    <span
                                                        className={cn(
                                                            'h-1.5 w-1.5 rounded-sm',
                                                            segment.swatchClass,
                                                        )}
                                                    />
                                                    <span className="text-muted-foreground">
                                                        {segment.label}
                                                    </span>
                                                    <b className="text-foreground ml-auto pl-3">
                                                        {formatTotal(
                                                            point.values[segment.key] ?? 0,
                                                        )}
                                                    </b>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div
                                className="flex w-full flex-col-reverse overflow-hidden rounded-t shadow-xs transition-all group-hover:brightness-110"
                                style={{
                                    height: `${Math.max(4, height)}%`,
                                }}
                            >
                                {point.total > 0 ? (
                                    segments.map((segment) => (
                                        <i
                                            key={segment.key}
                                            className={cn('block w-full', segment.barClass)}
                                            style={{
                                                height: `${((point.values[segment.key] ?? 0) / point.total) * 100}%`,
                                            }}
                                        />
                                    ))
                                ) : (
                                    <i className="block h-full w-full bg-muted" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="relative h-4 overflow-visible" aria-hidden>
                {points.map((point, index) => {
                    if (!shouldShowAxisLabel(point.start, labelInterval)) {
                        return null;
                    }

                    const isFirst = index < 3;
                    const isLast = index > points.length - 4;

                    return (
                        <span
                            key={point.start}
                            className="text-muted-foreground pointer-events-none absolute top-0 font-mono text-[10px] leading-4 whitespace-nowrap"
                            style={{
                                left: `${((index + 0.5) / points.length) * 100}%`,
                                transform: isFirst
                                    ? 'translateX(0)'
                                    : isLast
                                      ? 'translateX(-100%)'
                                      : 'translateX(-50%)',
                            }}
                        >
                            {formatAxisLabel(point.start, tickSeconds)}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
