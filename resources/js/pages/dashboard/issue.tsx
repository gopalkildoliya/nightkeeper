import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertOctagon,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Cpu,
    ExternalLink,
    FileCode,
    GitBranch,
    Layers,
    RotateCcw,
    Server,
    ShieldAlert,
    Users,
} from 'lucide-react';
import { CsrfField } from '@/components/csrf-field';
import { EventTable } from '@/components/dashboard/event-table';
import { StackTrace } from '@/components/dashboard/stack-trace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import { environmentPath } from '@/lib/range';
import { cn } from '@/lib/utils';
import type { DashboardEvent, DashboardIssue, ExceptionDetail } from '@/types/dashboard';

type IssueProps = {
    issue: DashboardIssue;
    events: DashboardEvent[];
    exception: ExceptionDetail | null;
};

export default function Issue({ issue, events, exception }: IssueProps) {
    const { currentEnvironment, isOwner } = usePage().props;
    const environmentId = currentEnvironment?.id ?? '';
    const [, copy] = useClipboard();
    const [copiedLocation, setCopiedLocation] = useState(false);

    const isOpen = issue.status === 'open';
    const location = issue.file ? `${issue.file}:${issue.line ?? 0}` : null;

    const handleCopyLocation = () => {
        if (!location) {
            return;
        }
        void copy(location);
        setCopiedLocation(true);
        setTimeout(() => setCopiedLocation(false), 2000);
    };

    return (
        <>
            <Head title={issue.class} />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 border-b border-border pb-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="gap-1 border-red-500/30 bg-red-500/10 font-mono text-[10px] font-semibold text-red-700 uppercase dark:text-red-400"
                                >
                                    <ShieldAlert className="w-3 h-3" />
                                    Unhandled
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'font-mono text-[10px] font-semibold uppercase',
                                        isOpen
                                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                                    )}
                                >
                                    {issue.status}
                                </Badge>
                            </div>
                            <h1 className="font-mono text-xl font-bold tracking-tight break-all text-foreground">
                                {issue.class}
                            </h1>
                            <p className="text-sm text-muted-foreground">{issue.message}</p>
                            {location ? (
                                <button
                                    type="button"
                                    onClick={handleCopyLocation}
                                    className="group inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <FileCode className="w-3.5 h-3.5" />
                                    <span>{location}</span>
                                    {copiedLocation ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-3 h-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                    )}
                                </button>
                            ) : null}
                        </div>

                        {isOwner ? (
                            <Form
                                action={environmentPath(environmentId, `issues/${issue.id}/${isOpen ? 'close' : 'reopen'}`)}
                                method="post"
                            >
                                {({ processing }) => (
                                    <>
                                        <CsrfField />
                                        <Button
                                            type="submit"
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                            className={cn(
                                                'gap-1.5',
                                                isOpen
                                                    ? 'border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400'
                                                    : 'border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400',
                                            )}
                                        >
                                            {isOpen ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            )}
                                            {isOpen ? 'Close issue' : 'Reopen issue'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        ) : null}
                    </div>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card className="border-t-2 border-t-red-500 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Occurrences
                                <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
                            </div>
                            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                                {issue.occurrences.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-2 border-t-indigo-500 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Users affected
                                <Users className="w-3.5 h-3.5 text-indigo-500" />
                            </div>
                            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                                {issue.users_affected.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-2 border-t-cyan-500 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                First seen
                                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                            </div>
                            <div className="mt-1 font-mono text-sm font-semibold text-foreground">{issue.first_seen_label}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-2 border-t-amber-500 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Last seen
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="mt-1 font-mono text-sm font-semibold text-foreground">{issue.last_seen_label}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Metadata */}
                {exception ? (
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                        {exception.laravel_version ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-0.5">
                                <Layers className="w-3 h-3 text-red-500" />
                                Laravel {exception.laravel_version}
                            </span>
                        ) : null}
                        {exception.php_version ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-0.5">
                                <Cpu className="w-3 h-3 text-indigo-500" />
                                PHP {exception.php_version}
                            </span>
                        ) : null}
                        {exception.server ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-0.5">
                                <Server className="w-3 h-3 text-cyan-500" />
                                {exception.server}
                            </span>
                        ) : null}
                        {exception.deploy ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-0.5">
                                <GitBranch className="w-3 h-3 text-amber-500" />
                                {exception.deploy}
                            </span>
                        ) : null}
                        {exception.user ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-0.5">
                                <Users className="w-3 h-3 text-violet-500" />
                                User {exception.user}
                            </span>
                        ) : null}
                        {exception.trace_id && environmentId ? (
                            <Link
                                href={environmentPath(environmentId, `traces/${exception.trace_id}`)}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-primary hover:underline"
                            >
                                View latest trace
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        ) : null}
                    </div>
                ) : null}

                {/* Stack trace */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b border-border/60 pb-3">
                        <CardTitle className="text-sm font-semibold">Stack trace</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Captured from the most recent occurrence{exception?.occurred_at_label ? ` · ${exception.occurred_at_label}` : ''}.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <StackTrace frames={exception?.frames ?? []} />
                    </CardContent>
                </Card>

                {/* Occurrences */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-foreground">Recent occurrences ({events.length})</h2>
                    <EventTable events={events} />
                </div>
            </div>
        </>
    );
}

Issue.layout = {
    breadcrumbs: [{ title: 'Issues', href: '/issues' }],
};
