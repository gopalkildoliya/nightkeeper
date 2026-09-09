import { Head, usePage } from '@inertiajs/react';
import { EventBadge } from '@/components/dashboard/event-badge';
import {
    DataTable,
    EmptyState,
    MonoLink,
    TableHead,
    Td,
    Th,
} from '@/components/dashboard/data-table';
import { Pager } from '@/components/dashboard/pager';
import { environmentPath, withRange } from '@/lib/range';
import type { DashboardIssue, Paginated } from '@/types/dashboard';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Users, Clock } from 'lucide-react';

type IssuesProps = {
    issues: Paginated<DashboardIssue>;
};

export default function Issues({ issues }: IssuesProps) {
    const { range, currentEnvironment } = usePage().props;
    const environmentId = currentEnvironment?.id;

    return (
        <>
            <Head title="Active Issues" />
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            Unhandled Exception Issues
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">Aggregated exceptions and error impact analysis</p>
                    </div>
                </div>

                {issues.data.length === 0 ? (
                    <EmptyState>
                        No open exception issues recorded in this time range.
                    </EmptyState>
                ) : (
                    <div className="space-y-4">
                        <DataTable>
                            <TableHead>
                                <Th>Exception Issue & Origin</Th>
                                <Th>Occurrences</Th>
                                <Th>Users Impacted</Th>
                                <Th>Last Seen</Th>
                            </TableHead>
                            <tbody>
                                {issues.data.map((issue) => (
                                    <tr key={issue.id} className="hover:bg-muted/40 transition-colors">
                                        <Td>
                                            <div className="flex items-start gap-3">
                                                <EventBadge type="exception" />
                                                <div className="min-w-0 space-y-1">
                                                    <MonoLink
                                                        href={withRange(
                                                            environmentId
                                                                ? environmentPath(
                                                                      environmentId,
                                                                      `/issues/${issue.id}`,
                                                                  )
                                                                : `/issues/${issue.id}`,
                                                            range.value,
                                                        )}
                                                        className="text-red-600 dark:text-red-400 hover:underline font-bold text-sm"
                                                    >
                                                        {issue.class}
                                                    </MonoLink>
                                                    <div className="text-foreground text-xs truncate max-w-2xl font-mono">
                                                        {issue.message}
                                                    </div>
                                                    {issue.file && (
                                                        <div className="text-muted-foreground font-mono text-[11px] bg-muted px-2 py-0.5 rounded inline-block border border-border">
                                                            {`${issue.file}:${issue.line}`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge variant="destructive" className="font-mono text-xs">
                                                {issue.occurrences.toLocaleString()} events
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                                                <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                                <span>{issue.users_affected.toLocaleString()} users</span>
                                            </div>
                                        </Td>
                                        <Td className="text-muted-foreground font-mono text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span>{issue.last_seen_label}</span>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>
                        <Pager paginator={issues} />
                    </div>
                )}
            </div>
        </>
    );
}

Issues.layout = {
    breadcrumbs: [{ title: 'Issues', href: '/issues' }],
};
