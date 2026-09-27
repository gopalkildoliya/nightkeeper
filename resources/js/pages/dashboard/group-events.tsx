import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { EventTable } from '@/components/dashboard/event-table';
import type { DashboardEvent, EventGroup } from '@/types/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Clock, 
    Zap, 
    Repeat, 
    TrendingUp, 
    CheckCircle2, 
    AlertTriangle, 
    Database, 
    Copy, 
    Check, 
    Code, 
    ExternalLink,
    Server,
    Layers,
    FileText
} from 'lucide-react';

type GroupEventsProps = {
    heading: string;
    group: EventGroup | null;
    events: DashboardEvent[];
};

export default function GroupEvents({
    heading,
    group,
    events,
}: GroupEventsProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Head title={`${heading} Occurrences`} />
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                
                {/* Header Title Section */}
                <div className="flex flex-col gap-3 border-b border-border pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-foreground">{heading} Details</h1>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    Hash: {group?.group_hash ? group.group_hash.substring(0, 10) : 'N/A'}
                                </Badge>
                            </div>
                            {group?.last_seen_label && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Last seen {group.last_seen_label}</span>
                                    {group.sample_trace_id && (
                                        <>
                                            <span>•</span>
                                            <Link
                                                href={`/traces/${group.sample_trace_id}`}
                                                className="text-primary hover:underline font-mono inline-flex items-center gap-1"
                                            >
                                                <span>View Sample Trace</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Status Breakdown Badges */}
                        {group?.counts && (
                            <div className="flex flex-wrap items-center gap-2">
                                {'xx123' in group.counts && (group.counts.xx123 ?? 0) > 0 && (
                                    <Badge variant="success" className="font-mono text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                                        {(group.counts.xx123 ?? 0).toLocaleString()} 2xx/3xx
                                    </Badge>
                                )}
                                {'xx4' in group.counts && (group.counts.xx4 ?? 0) > 0 && (
                                    <Badge variant="warning" className="font-mono text-xs">
                                        <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                                        {(group.counts.xx4 ?? 0).toLocaleString()} 4xx
                                    </Badge>
                                )}
                                {'xx5' in group.counts && (group.counts.xx5 ?? 0) > 0 && (
                                    <Badge variant="destructive" className="font-mono text-xs">
                                        <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                                        {(group.counts.xx5 ?? 0).toLocaleString()} 5xx
                                    </Badge>
                                )}
                                {'succeeded' in group.counts && (
                                    <Badge variant="success" className="font-mono text-xs">
                                        {(group.counts.succeeded ?? 0).toLocaleString()} Succeeded
                                    </Badge>
                                )}
                                {'processed' in group.counts && (
                                    <Badge variant="success" className="font-mono text-xs">
                                        {(group.counts.processed ?? 0).toLocaleString()} Processed
                                    </Badge>
                                )}
                                {'failed' in group.counts && (group.counts.failed ?? 0) > 0 && (
                                    <Badge variant="destructive" className="font-mono text-xs">
                                        {(group.counts.failed ?? 0).toLocaleString()} Failed
                                    </Badge>
                                )}
                                {'hit' in group.counts && (
                                    <Badge variant="success" className="font-mono text-xs">
                                        {(group.counts.hit ?? 0).toLocaleString()} Hits
                                    </Badge>
                                )}
                                {'miss' in group.counts && (group.counts.miss ?? 0) > 0 && (
                                    <Badge variant="warning" className="font-mono text-xs">
                                        {(group.counts.miss ?? 0).toLocaleString()} Misses
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Query / Label Code Display */}
                    {group?.label && (
                        <div className="relative group/code mt-2">
                            <div className="flex items-center justify-between bg-slate-950 text-slate-100 rounded-xl border border-slate-800 p-3.5 pl-4 pr-12 font-mono text-xs leading-relaxed overflow-x-auto shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-cyan-300 font-semibold">{group.label}</span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(group.label)}
                                className="absolute right-2 top-2.5 h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                                title="Copy Query or Label"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                        </div>
                    )}

                    {/* Origin File / Class Metadata */}
                    {group?.meta && (group.meta.class || group.meta.file || group.meta.connection || group.meta.sql) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground pt-1">
                            {group.meta.class && (
                                <span className="flex items-center gap-1 bg-muted/50 border border-border px-2.5 py-0.5 rounded-md">
                                    <FileText className="w-3 h-3 text-indigo-500" />
                                    {group.meta.class}
                                </span>
                            )}
                            {group.meta.file && (
                                <span className="flex items-center gap-1 bg-muted/50 border border-border px-2.5 py-0.5 rounded-md">
                                    <Code className="w-3 h-3 text-amber-500" />
                                    {group.meta.file}:{group.meta.line}
                                </span>
                            )}
                            {group.meta.connection && (
                                <span className="flex items-center gap-1 bg-muted/50 border border-border px-2.5 py-0.5 rounded-md">
                                    <Database className="w-3 h-3 text-cyan-500" />
                                    DB: {group.meta.connection}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Metrics Summary Cards Row */}
                {group && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Card className="bg-card border-border shadow-sm border-t-2 border-t-indigo-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Occurrences
                                    <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <div className="text-2xl font-bold font-mono text-foreground mt-1 tabular-nums">
                                    {group.occurrences.toLocaleString()}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">Total Executions</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border shadow-sm border-t-2 border-t-cyan-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Avg Latency
                                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                                </div>
                                <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 tabular-nums">
                                    {group.avg_label}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">Mean execution time</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border shadow-sm border-t-2 border-t-violet-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    P95 Latency
                                    <Zap className="w-3.5 h-3.5 text-violet-500" />
                                </div>
                                <div className="text-2xl font-bold font-mono text-violet-600 dark:text-violet-400 mt-1 tabular-nums">
                                    {group.p95_label}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">95% faster than</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border shadow-sm border-t-2 border-t-amber-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Max Latency
                                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                                </div>
                                <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                                    {group.max_label}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">Peak response time</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Sampled Events Stream */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        Sampled Occurrences Stream ({events.length})
                    </h2>
                    <EventTable events={events} />
                </div>

            </div>
        </>
    );
}

GroupEvents.layout = {
    breadcrumbs: [{ title: 'Occurrences', href: '/requests' }],
};
