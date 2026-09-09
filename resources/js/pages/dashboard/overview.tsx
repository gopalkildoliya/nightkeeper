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
import { durationLabel } from '@/lib/duration';
import { environmentPath, withRange } from '@/lib/range';
import type { EventGroup, RequestBucket } from '@/types/dashboard';
import { Activity, Zap, ShieldAlert, ListTodo, ArrowUpRight } from 'lucide-react';

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
};

function VolumeChart({ buckets }: { buckets: RequestBucket[] }) {
    const maxTotal = Math.max(1, ...buckets.map((bucket) => bucket.total));

    return (
        <div
            className="flex h-32 items-end gap-1 pt-3"
            aria-label="Request volume"
        >
            {buckets.map((bucket) => {
                const height = (bucket.total / maxTotal) * 100;
                const tooltipText = `${bucket.label}: ${bucket.total.toLocaleString()} Reqs (${bucket.xx5} 5xx, ${bucket.xx4} 4xx)`;

                return (
                    <div
                        key={bucket.start}
                        className="group relative flex h-full min-w-0 flex-1 flex-col justify-end cursor-pointer"
                        title={tooltipText}
                    >
                        <div
                            className="flex w-full flex-col-reverse rounded-t overflow-hidden transition-all group-hover:brightness-110 shadow-xs"
                            style={{ height: `${Math.max(4, height)}%` }}
                        >
                            {bucket.total > 0 ? (
                                <>
                                    <i
                                        className="block w-full bg-emerald-500"
                                        style={{
                                            height: `${(bucket.xx123 / bucket.total) * 100}%`,
                                        }}
                                    />
                                    <i
                                        className="block w-full bg-amber-400"
                                        style={{
                                            height: `${(bucket.xx4 / bucket.total) * 100}%`,
                                        }}
                                    />
                                    <i
                                        className="block w-full bg-red-500"
                                        style={{
                                            height: `${(bucket.xx5 / bucket.total) * 100}%`,
                                        }}
                                    />
                                </>
                            ) : (
                                <i className="block w-full bg-muted h-full" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DurationChart({ buckets }: { buckets: RequestBucket[] }) {
    const maxAvg = Math.max(1, ...buckets.map((bucket) => bucket.avg_us ?? 0));

    return (
        <div
            className="flex h-32 items-end gap-1 pt-3"
            aria-label="Average duration"
        >
            {buckets.map((bucket) => (
                <div
                    key={bucket.start}
                    className="group relative flex h-full min-w-0 flex-1 flex-col justify-end cursor-pointer"
                    title={`${bucket.label}: ${durationLabel(bucket.avg_us)}`}
                >
                    <i
                        className="block w-full rounded-t bg-cyan-600 dark:bg-cyan-500/80 transition-all group-hover:bg-cyan-500 shadow-xs"
                        style={{
                            height: `${bucket.avg_us ? Math.max(4, (bucket.avg_us / maxAvg) * 100) : 2}%`,
                        }}
                    />
                </div>
            ))}
        </div>
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
}: OverviewProps) {
    const environmentId = usePage().props.currentEnvironment?.id;
    const maxSlowRouteUs = Math.max(1, ...slow_routes.map((r) => r.maxUs || r.p95Us || 1));

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
                        <CardContent className="pt-4 flex flex-col gap-3">
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
                        <CardContent className="pt-4 flex flex-col gap-3">
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
                </div>

                {/* Secondary Cards: Exceptions & Job Attempts */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Exceptions */}
                    <Card className="border-t-2 border-t-red-500 bg-card border-border shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exceptions & Errors</CardDescription>
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                            </div>
                            <CardTitle className="font-mono text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums mt-1">
                                {exceptions.total.toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground ml-2">reported in {range.label}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex gap-4 text-xs font-mono">
                                <span>
                                    Handled <b className="text-foreground">{exceptions.handled.toLocaleString()}</b>
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                    Unhandled <b>{exceptions.unhandled.toLocaleString()}</b>
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Errors have impacted <b className="text-foreground font-mono">{exceptions.users.toLocaleString()}</b> unique users.
                            </p>
                            <Link
                                href={withRange(
                                    environmentId
                                        ? environmentPath(environmentId, '/exceptions')
                                        : '/exceptions',
                                    range.value,
                                )}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors mt-1"
                            >
                                View Exceptions <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Jobs */}
                    <Card className="border-t-2 border-t-violet-500 bg-card border-border shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background Job Workers</CardDescription>
                                <ListTodo className="w-4 h-4 text-violet-500" />
                            </div>
                            <CardTitle className="font-mono text-2xl font-bold text-foreground tabular-nums mt-1">
                                {jobs.attempts.toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground ml-2">Job Attempts</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="text-xs text-muted-foreground">
                                Job Execution Range: <b className="font-mono text-foreground">{jobs.min_label} — {jobs.max_label}</b>
                            </div>
                            <Link
                                href={withRange(
                                    environmentId
                                        ? environmentPath(environmentId, '/jobs')
                                        : '/jobs',
                                    range.value,
                                )}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors mt-2"
                            >
                                View Queue Performance <ArrowUpRight className="w-3 h-3" />
                            </Link>
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
                                    const pct = ((group.p95Us || group.maxUs || 1) / maxSlowRouteUs) * 100;
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
