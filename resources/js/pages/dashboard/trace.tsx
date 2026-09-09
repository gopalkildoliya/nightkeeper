import { Head } from '@inertiajs/react';
import { EventBadge } from '@/components/dashboard/event-badge';
import { cn } from '@/lib/utils';
import type { DashboardEvent, TraceSpan } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Layers, Server, Code } from 'lucide-react';

type TraceProps = {
    traceId: string;
    event_count: number;
    parent: DashboardEvent;
    spans: TraceSpan[];
};

const barClass: Record<string, string> = {
    stage: 'bg-indigo-600 dark:bg-indigo-600/80 border border-indigo-400/40 text-white',
    'child-query': 'bg-amber-600 dark:bg-amber-600/80 border border-amber-400/40 text-white',
    'child-exception': 'bg-red-600 dark:bg-red-600/80 border border-red-400/40 text-white',
    'child-cache-event': 'bg-emerald-600 dark:bg-emerald-600/80 border border-emerald-400/40 text-white',
    'child-outgoing-request': 'bg-sky-600 dark:bg-sky-600/80 border border-sky-400/40 text-white',
    'child-mail': 'bg-rose-600 dark:bg-rose-600/80 border border-rose-400/40 text-white',
    'child-notification': 'bg-pink-600 dark:bg-pink-600/80 border border-pink-400/40 text-white',
    'child-scheduled-task': 'bg-indigo-600 dark:bg-indigo-600/80 border border-indigo-400/40 text-white',
};

export default function Trace({
    traceId,
    event_count,
    parent,
    spans,
}: TraceProps) {
    return (
        <>
            <Head title={`Trace: ${parent.title}`} />
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold font-mono text-foreground">{parent.title}</h1>
                            <Badge variant={parent.is_error ? "destructive" : "success"}>
                                {parent.status_label || (parent.is_error ? 'ERR' : 'OK')}
                            </Badge>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                            Trace ID: <span className="text-primary font-semibold">{traceId}</span> • {event_count} events total
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                        <div className="bg-card border border-border px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-muted-foreground">Total Duration:</span>
                            <span className="text-foreground font-bold">{parent.duration_label}</span>
                        </div>
                        {parent.server && (
                            <div className="bg-card border border-border px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xs">
                                <Server className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-muted-foreground">Server:</span>
                                <span className="text-foreground">{parent.server}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Spans Waterfall Card */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="border-b border-border/80">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            Execution Spans Timeline Waterfall
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-2">
                        {spans.map((span, index) => (
                            <div
                                key={`${span.t}-${index}`}
                                className="relative h-9 overflow-hidden rounded-lg border border-border bg-muted/30 transition-all hover:border-border/80"
                                title={span.title}
                            >
                                <i
                                    className={cn(
                                        'absolute top-0 bottom-0 rounded-sm shadow-xs transition-all opacity-90',
                                        barClass[span.kind] ?? 'bg-indigo-600 border border-indigo-400/40',
                                    )}
                                    style={{
                                        left: `${span.left}%`,
                                        width: `${Math.max(1, span.width)}%`,
                                    }}
                                />
                                <span className="relative z-10 flex h-full items-center justify-between gap-3 px-3 font-mono text-xs text-foreground">
                                    <span className="flex min-w-0 items-center gap-2">
                                        <EventBadge type={span.t} />
                                        <span className="truncate font-medium">{span.title}</span>
                                    </span>
                                    <span className="font-semibold text-foreground bg-card px-2 py-0.5 rounded border border-border shadow-2xs">
                                        {span.duration_label}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Parent Payload JSON */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="border-b border-border/80">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Code className="w-4 h-4 text-cyan-500" />
                            Request Event Payload & Context Meta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <pre className="overflow-auto rounded-xl border border-border bg-slate-950 text-cyan-300 p-4 font-mono text-xs leading-relaxed max-h-96">
                            {JSON.stringify(parent.payload ?? {}, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

            </div>
        </>
    );
}

Trace.layout = {
    breadcrumbs: [{ title: 'Trace', href: '/' }],
};
