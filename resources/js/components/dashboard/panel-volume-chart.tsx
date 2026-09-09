import {
    Bell,
    Bug,
    CalendarClock,
    Database,
    Globe,
    HardDrive,
    ListTodo,
    Mail,
    Terminal,
    Workflow,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { VolumeBucket } from '@/types/dashboard';
import { cn } from '@/lib/utils';

type Kind =
    | 'request'
    | 'query'
    | 'job'
    | 'exception'
    | 'command'
    | 'scheduled-task'
    | 'outgoing-request'
    | 'cache'
    | 'mail'
    | 'notification';

type Segment = {
    key: string;
    label: string;
    barClass: string;
    swatchClass: string;
    destructive?: boolean;
};

type ChartConfig = {
    title: string;
    unit: string;
    ariaLabel: string;
    accentClass: string;
    iconClass: string;
    icon: typeof Workflow;
    segments: Segment[];
};

const charts: Record<Kind, ChartConfig> = {
    request: {
        title: 'Requests',
        unit: 'in this range',
        ariaLabel: 'Request volume',
        accentClass: 'border-t-blue-500',
        iconClass: 'text-blue-500',
        icon: Workflow,
        segments: [
            { key: 'xx123', label: '2xx', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'xx4', label: '4xx', barClass: 'bg-amber-400', swatchClass: 'bg-amber-400' },
            { key: 'xx5', label: '5xx', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    query: {
        title: 'Queries',
        unit: 'in this range',
        ariaLabel: 'Query volume',
        accentClass: 'border-t-amber-500',
        iconClass: 'text-amber-500',
        icon: Database,
        segments: [
            { key: 'ok', label: 'Queries', barClass: 'bg-amber-500', swatchClass: 'bg-amber-500' },
        ],
    },
    job: {
        title: 'Job attempts',
        unit: 'in this range',
        ariaLabel: 'Job attempt volume',
        accentClass: 'border-t-violet-500',
        iconClass: 'text-violet-500',
        icon: ListTodo,
        segments: [
            { key: 'processed', label: 'Processed', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'released', label: 'Released', barClass: 'bg-amber-400', swatchClass: 'bg-amber-400' },
            { key: 'failed', label: 'Failed', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    exception: {
        title: 'Exceptions',
        unit: 'in this range',
        ariaLabel: 'Exception volume',
        accentClass: 'border-t-red-500',
        iconClass: 'text-red-500',
        icon: Bug,
        segments: [
            { key: 'handled', label: 'Handled', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'unhandled', label: 'Unhandled', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    command: {
        title: 'Command runs',
        unit: 'in this range',
        ariaLabel: 'Command volume',
        accentClass: 'border-t-purple-500',
        iconClass: 'text-purple-500',
        icon: Terminal,
        segments: [
            { key: 'succeeded', label: 'Succeeded', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'failed', label: 'Failed', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    'scheduled-task': {
        title: 'Scheduled runs',
        unit: 'in this range',
        ariaLabel: 'Scheduled task volume',
        accentClass: 'border-t-indigo-500',
        iconClass: 'text-indigo-500',
        icon: CalendarClock,
        segments: [
            { key: 'processed', label: 'Processed', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'skipped', label: 'Skipped', barClass: 'bg-amber-400', swatchClass: 'bg-amber-400' },
            { key: 'failed', label: 'Failed', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    'outgoing-request': {
        title: 'Outgoing requests',
        unit: 'in this range',
        ariaLabel: 'Outgoing request volume',
        accentClass: 'border-t-sky-500',
        iconClass: 'text-sky-500',
        icon: Globe,
        segments: [
            { key: 'xx123', label: '2xx', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'xx4', label: '4xx', barClass: 'bg-amber-400', swatchClass: 'bg-amber-400' },
            { key: 'xx5', label: '5xx', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    cache: {
        title: 'Cache events',
        unit: 'in this range',
        ariaLabel: 'Cache event volume',
        accentClass: 'border-t-emerald-500',
        iconClass: 'text-emerald-500',
        icon: HardDrive,
        segments: [
            { key: 'hit', label: 'Hits', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'miss', label: 'Misses', barClass: 'bg-amber-400', swatchClass: 'bg-amber-400' },
            { key: 'write', label: 'Writes', barClass: 'bg-sky-500', swatchClass: 'bg-sky-500' },
            { key: 'delete', label: 'Deletes', barClass: 'bg-muted-foreground', swatchClass: 'bg-muted-foreground' },
            { key: 'failures', label: 'Failures', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    mail: {
        title: 'Mail',
        unit: 'in this range',
        ariaLabel: 'Mail volume',
        accentClass: 'border-t-rose-500',
        iconClass: 'text-rose-500',
        icon: Mail,
        segments: [
            { key: 'sent', label: 'Sent', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'failed', label: 'Failed', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
    notification: {
        title: 'Notifications',
        unit: 'in this range',
        ariaLabel: 'Notification volume',
        accentClass: 'border-t-pink-500',
        iconClass: 'text-pink-500',
        icon: Bell,
        segments: [
            { key: 'sent', label: 'Sent', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
            { key: 'failed', label: 'Failed', barClass: 'bg-red-500', swatchClass: 'bg-red-500', destructive: true },
        ],
    },
};

export function PanelVolumeChart({
    kind,
    buckets,
}: {
    kind: Kind;
    buckets: VolumeBucket[];
}) {
    const config = charts[kind];
    const Icon = config.icon;
    const maxTotal = Math.max(1, ...buckets.map((bucket) => bucket.total));
    const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
    const segmentTotals = Object.fromEntries(
        config.segments.map((segment) => [
            segment.key,
            buckets.reduce(
                (sum, bucket) => sum + (bucket.segments[segment.key] ?? 0),
                0,
            ),
        ]),
    );

    return (
        <Card
            className={cn(
                'border-t-2 border-border bg-card shadow-sm',
                config.accentClass,
            )}
        >
            <CardHeader className="border-b border-border/60 pb-2">
                <div className="flex items-center justify-between">
                    <CardDescription className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        {config.title}
                    </CardDescription>
                    <Icon className={cn('h-4 w-4', config.iconClass)} />
                </div>
                <CardTitle className="text-foreground mt-1 font-mono text-3xl font-bold tabular-nums">
                    {total.toLocaleString()}
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                        {config.unit}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                    {config.segments.map((segment) => (
                        <span
                            key={segment.key}
                            className={cn(
                                'flex items-center gap-1.5',
                                segment.destructive &&
                                    'text-red-600 dark:text-red-400',
                            )}
                        >
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-sm',
                                    segment.swatchClass,
                                )}
                            />
                            {segment.label}{' '}
                            <b className={cn(!segment.destructive && 'text-foreground')}>
                                {(segmentTotals[segment.key] ?? 0).toLocaleString()}
                            </b>
                        </span>
                    ))}
                </div>
                <div
                    className="flex h-32 items-end gap-1 pt-3"
                    aria-label={config.ariaLabel}
                >
                    {buckets.map((bucket) => {
                        const height = (bucket.total / maxTotal) * 100;
                        const tooltipParts = config.segments
                            .map(
                                (segment) =>
                                    `${bucket.segments[segment.key] ?? 0} ${segment.label.toLowerCase()}`,
                            )
                            .join(', ');

                        return (
                            <div
                                key={bucket.start}
                                className="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-end"
                                title={`${bucket.label}: ${bucket.total.toLocaleString()} (${tooltipParts})`}
                            >
                                <div
                                    className="flex w-full flex-col-reverse overflow-hidden rounded-t shadow-xs transition-all group-hover:brightness-110"
                                    style={{
                                        height: `${Math.max(4, height)}%`,
                                    }}
                                >
                                    {bucket.total > 0 ? (
                                        config.segments.map((segment) => (
                                            <i
                                                key={segment.key}
                                                className={cn('block w-full', segment.barClass)}
                                                style={{
                                                    height: `${((bucket.segments[segment.key] ?? 0) / bucket.total) * 100}%`,
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
            </CardContent>
        </Card>
    );
}
