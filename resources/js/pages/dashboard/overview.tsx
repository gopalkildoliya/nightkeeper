import { Head, Link, usePage } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DataTable,
    EmptyState,
    MonoLink,
    TableHead,
    Td,
    Th,
    LatencyBar,
} from '@/components/dashboard/data-table';
import { MethodBadge } from '@/components/dashboard/event-badge';
import { PanelVolumeChart } from '@/components/dashboard/panel-volume-chart';
import { StackedBarChart } from '@/components/dashboard/stacked-bar-chart';
import { durationLabel } from '@/lib/duration';
import { environmentPath, withRange } from '@/lib/range';
import type { EventGroup, RequestBucket, VolumeBucket } from '@/types/dashboard';
import {
    Activity,
    ArrowUpRight,
    Bell,
    CalendarClock,
    Globe,
    HardDrive,
    LayoutGrid,
    Mail,
    Terminal,
    Zap,
} from 'lucide-react';

type OverviewProps = {
    range: { value: string; label: string };
    request_count: number;
    status: { xx123: number; xx4: number; xx5: number };
    duration: {
        min: number | null;
        max: number | null;
        avg: number | null;
        p95: number | null;
        min_label: string;
        max_label: string;
        avg_label: string;
        p95_label: string;
    };
    buckets: RequestBucket[];
    slow_routes: EventGroup[];
    slow_route_threshold_label: string;
    exceptions: {
        total: number;
        handled: number;
        unhandled: number;
        users: number;
    };
    jobs: {
        attempts: number;
        min_us: number | null;
        max_us: number | null;
        min_label: string;
        max_label: string;
    };
    job_buckets: VolumeBucket[];
    exception_buckets: VolumeBucket[];
    query_buckets: VolumeBucket[];
    activity: {
        commands: number;
        scheduled_tasks: number;
        outgoing_requests: number;
        cache: number;
        mail: number;
        notifications: number;
    };
};

const requestSegments = [
    { key: 'xx123', label: '2xx', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
    { key: 'xx4', label: '4xx', barClass: 'bg-amber-400', swatchClass: 'bg-amber-400' },
    { key: 'xx5', label: '5xx', barClass: 'bg-red-500', swatchClass: 'bg-red-500' },
];

function VolumeChart({ buckets }: { buckets: RequestBucket[] }) {
    return (
        <StackedBarChart
            ariaLabel="Request volume"
            points={buckets.map((bucket) => ({
                start: bucket.start,
                label: bucket.label,
                total: bucket.total,
                values: {
                    xx123: bucket.xx123,
                    xx4: bucket.xx4,
                    xx5: bucket.xx5,
                },
            }))}
            segments={requestSegments}
            totalNoun="requests"
        />
    );
}

function DurationChart({ buckets }: { buckets: RequestBucket[] }) {
    return (
        <StackedBarChart
            ariaLabel="Average duration"
            points={buckets.map((bucket) => ({
                start: bucket.start,
                label: bucket.label,
                total: bucket.avg_us ?? 0,
                values: { avg: bucket.avg_us ?? 0 },
            }))}
            segments={[
                {
                    key: 'avg',
                    label: 'Avg',
                    barClass: 'bg-cyan-600 dark:bg-cyan-500/80',
                    swatchClass: 'bg-cyan-600',
                },
            ]}
            formatTotal={durationLabel}
        />
    );
}

function PanelLink({ href, children }: { href: string; children: string }) {
    return (
        <Link
            href={href}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
            {children} <ArrowUpRight className="h-3 w-3" />
        </Link>
    );
}

export default function Overview({
    range,
    request_count,
    status,
    duration,
    buckets,
    slow_routes,
    slow_route_threshold_label,
    exceptions,
    jobs,
    job_buckets,
    exception_buckets,
    query_buckets,
    activity,
}: OverviewProps) {
    const environmentId = usePage().props.currentEnvironment?.id;
    const maxSlowRouteUs = Math.max(
        1,
        ...slow_routes.map((route) => route.p95_us || route.max_us || 1),
    );

    const panelHref = (suffix: string): string =>
        withRange(
            environmentId ? environmentPath(environmentId, suffix) : suffix,
            range.value,
        );

    const activityItems = [
        {
            key: 'commands',
            label: 'Commands',
            suffix: '/commands',
            icon: Terminal,
            value: activity.commands,
        },
        {
            key: 'scheduled',
            label: 'Scheduled',
            suffix: '/scheduled-tasks',
            icon: CalendarClock,
            value: activity.scheduled_tasks,
        },
        {
            key: 'outgoing',
            label: 'Outgoing',
            suffix: '/outgoing-requests',
            icon: Globe,
            value: activity.outgoing_requests,
        },
        {
            key: 'cache',
            label: 'Cache',
            suffix: '/cache',
            icon: HardDrive,
            value: activity.cache,
        },
        {
            key: 'mail',
            label: 'Mail',
            suffix: '/mail',
            icon: Mail,
            value: activity.mail,
        },
        {
            key: 'notifications',
            label: 'Notifications',
            suffix: '/notifications',
            icon: Bell,
            value: activity.notifications,
        },
    ];

    return (
        <>
            <Head title="Overview" />
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                
                {/* Header title & live status */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Overview Dashboard
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">Application performance telemetry for {range.label}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE STREAMING
                    </div>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Activity Card */}
                    <Card className="border-t-2 border-t-indigo-500 bg-card border-border shadow-sm">
                        <CardHeader className="pb-2 border-b border-border/60">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Activity</CardDescription>
                                <Activity className="w-4 h-4 text-indigo-500" />
                            </div>
                            <CardTitle className="font-mono text-3xl font-bold tabular-nums text-foreground mt-1">
                                {request_count.toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground ml-2">Requests</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 overflow-visible pt-4">
                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-sm bg-emerald-500"></span>
                                    1/2/3xx <b className="text-foreground">{status.xx123.toLocaleString()}</b>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-sm bg-amber-400"></span>
                                    4xx <b className="text-foreground">{status.xx4.toLocaleString()}</b>
                                </span>
                                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                    <span className="w-2 h-2 rounded-sm bg-red-500"></span>
                                    5xx <b>{status.xx5.toLocaleString()}</b>
                                </span>
                            </div>
                            <VolumeChart buckets={buckets} />
                        </CardContent>
                    </Card>

                    {/* Duration Card */}
                    <Card className="border-t-2 border-t-cyan-500 bg-card border-border shadow-sm">
                        <CardHeader className="pb-2 border-b border-border/60">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latency & Response Time</CardDescription>
                                <Zap className="w-4 h-4 text-cyan-500" />
                            </div>
                            <CardTitle className="font-mono text-3xl font-bold tabular-nums text-foreground mt-1">
                                {duration.avg_label || '0ms'}
                                <span className="text-xs font-normal text-muted-foreground ml-2">Avg Latency ({duration.min_label} – {duration.max_label})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 overflow-visible pt-4">
                            <div className="flex items-center gap-4 text-xs font-mono text-foreground">
                                <span>
                                    AVG <b className="text-cyan-600 dark:text-cyan-400">{duration.avg_label}</b>
                                </span>
                                <span>
                                    P95 <b className="text-violet-600 dark:text-violet-400">{duration.p95_label}</b>
                                </span>
                            </div>
                            <DurationChart buckets={buckets} />
                        </CardContent>
                    </Card>

                    <PanelVolumeChart
                        kind="job"
                        buckets={job_buckets}
                        footer={
                            <div className="flex flex-col gap-2">
                                <p className="text-muted-foreground text-xs">
                                    Execution range:{' '}
                                    <b className="text-foreground font-mono">
                                        {jobs.min_label} — {jobs.max_label}
                                    </b>
                                </p>
                                <PanelLink href={panelHref('/jobs')}>
                                    View jobs
                                </PanelLink>
                            </div>
                        }
                    />
                    <PanelVolumeChart
                        kind="exception"
                        buckets={exception_buckets}
                        footer={
                            <div className="flex flex-col gap-2">
                                <p className="text-muted-foreground text-xs">
                                    Impacted{' '}
                                    <b className="text-foreground font-mono">
                                        {exceptions.users.toLocaleString()}
                                    </b>{' '}
                                    unique users
                                </p>
                                <PanelLink href={panelHref('/exceptions')}>
                                    View exceptions
                                </PanelLink>
                            </div>
                        }
                    />
                    <PanelVolumeChart
                        kind="query"
                        buckets={query_buckets}
                        footer={
                            <PanelLink href={panelHref('/queries')}>
                                View queries
                            </PanelLink>
                        }
                    />
                    <Card className="border-t-2 border-t-slate-500 border-border bg-card shadow-sm">
                        <CardHeader className="border-b border-border/60 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                    More activity
                                </CardDescription>
                                <LayoutGrid className="h-4 w-4 text-slate-500" />
                            </div>
                            <CardTitle className="text-foreground mt-1 font-mono text-3xl font-bold tabular-nums">
                                {Object.values(activity)
                                    .reduce((sum, count) => sum + count, 0)
                                    .toLocaleString()}
                                <span className="text-muted-foreground ml-2 text-xs font-normal">
                                    across other panels
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 pt-4">
                            {activityItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.key}
                                        href={panelHref(item.suffix)}
                                        className="hover:bg-muted/40 flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors"
                                    >
                                        <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="text-muted-foreground truncate text-xs">
                                                {item.label}
                                            </span>
                                            <b className="text-foreground font-mono text-sm tabular-nums">
                                                {item.value.toLocaleString()}
                                            </b>
                                        </span>
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Slow Routes Section */}
                <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            {slow_routes.length} routes exceeded performance thresholds
                        </h2>
                        <span className="text-xs font-mono text-muted-foreground">Threshold: &gt; {slow_route_threshold_label}</span>
                    </div>

                    {slow_routes.length === 0 ? (
                        <EmptyState>
                            No routes slower than {slow_route_threshold_label} in this time range.
                        </EmptyState>
                    ) : (
                        <DataTable>
                            <TableHead>
                                <Th>Route Endpoint</Th>
                                <Th>Requests</Th>
                                <Th>Max Latency</Th>
                                <Th>P95 Latency</Th>
                            </TableHead>
                            <tbody>
                                {slow_routes.map((group) => {
                                    const pct = ((group.p95_us || group.max_us || 1) / maxSlowRouteUs) * 100;
                                    const pathParts = group.label.split(' ');
                                    const method = pathParts.length > 1 ? pathParts[0] : undefined;
                                    const path = pathParts.length > 1 ? pathParts.slice(1).join(' ') : group.label;

                                    return (
                                        <tr key={group.group_hash} className="hover:bg-muted/40 transition-colors cursor-pointer">
                                            <Td className="truncate font-mono">
                                                <div className="flex items-center gap-2">
                                                    {method && <MethodBadge method={method} />}
                                                    <MonoLink
                                                        href={withRange(
                                                            environmentId
                                                                ? environmentPath(
                                                                      environmentId,
                                                                      `/requests/${group.group_hash}`,
                                                                  )
                                                                : `/requests/${group.group_hash}`,
                                                            range.value,
                                                        )}
                                                    >
                                                        {path}
                                                    </MonoLink>
                                                </div>
                                            </Td>
                                            <Td className="font-mono">
                                                {group.occurrences.toLocaleString()}
                                            </Td>
                                            <Td className="text-red-600 dark:text-red-400 font-mono font-semibold">
                                                MAX {group.max_label}
                                            </Td>
                                            <Td className="font-mono">
                                                <LatencyBar pct={pct} label={group.p95_label} />
                                            </Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </DataTable>
                    )}
                </div>
            </div>
        </>
    );
}

Overview.layout = {
    breadcrumbs: [{ title: 'Overview', href: '/' }],
};
