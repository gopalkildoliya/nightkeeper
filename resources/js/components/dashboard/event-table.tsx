import { Link, usePage } from '@inertiajs/react';
import { EventBadge, MethodBadge } from '@/components/dashboard/event-badge';
import {
    DataTable,
    EmptyState,
    TableHead,
    Td,
    Th,
} from '@/components/dashboard/data-table';
import { cn } from '@/lib/utils';
import { environmentPath } from '@/lib/range';
import type { DashboardEvent } from '@/types/dashboard';
import { ExternalLink } from 'lucide-react';

export function EventTable({ events }: { events: DashboardEvent[] }) {
    const environmentId = usePage().props.currentEnvironment?.id;
    const isCommandList = events.some((event) => event.t === 'command');

    if (events.length === 0) {
        return (
            <EmptyState>
                No events recorded yet. Ensure <code className="font-mono text-primary">NIGHTWATCH_BASE_URL</code> is set in your application's environment.
            </EmptyState>
        );
    }

    return (
        <DataTable>
            <TableHead>
                <Th>Type</Th>
                <Th>Summary & Trace Endpoint</Th>
                <Th>Status</Th>
                <Th>Duration</Th>
                {isCommandList ? (
                    <>
                        <Th>Queries</Th>
                        <Th>Memory</Th>
                    </>
                ) : null}
                <Th>Server</Th>
                <Th>Time</Th>
            </TableHead>
            <tbody>
                {events.map((event) => {
                    const titleParts = event.title ? event.title.split(' ') : [];
                    const hasMethod = titleParts.length > 1 && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(titleParts[0].toUpperCase());
                    const method = hasMethod ? titleParts[0] : undefined;
                    const path = hasMethod ? titleParts.slice(1).join(' ') : event.title;

                    return (
                        <tr key={event.id} className="hover:bg-muted/40 transition-colors">
                            <Td>
                                <EventBadge type={event.t} />
                            </Td>
                            <Td className="font-mono">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        {method && <MethodBadge method={method} />}
                                        {event.trace_id && environmentId ? (
                                            <Link
                                                href={environmentPath(
                                                    environmentId,
                                                    `/traces/${event.trace_id}`,
                                                )}
                                                className="text-primary hover:underline flex items-center gap-1 group font-semibold"
                                            >
                                                <span>{path || 'command'}</span>
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        ) : (
                                            <span className="text-foreground">{path || 'command'}</span>
                                        )}
                                    </div>
                                    {event.command_line && event.command_line !== event.title ? (
                                        <div className="text-muted-foreground max-w-xl truncate text-xs">
                                            {event.command_line}
                                        </div>
                                    ) : null}
                                    {event.class ? (
                                        <div className="text-muted-foreground max-w-xl truncate text-xs">
                                            {event.class}
                                        </div>
                                    ) : null}
                                </div>
                            </Td>
                            <Td>
                                <span
                                    className={cn(
                                        'px-2 py-0.5 rounded text-[11px] font-mono font-semibold inline-block border',
                                        event.is_error
                                            ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                                    )}
                                >
                                    {event.status_label || (event.is_error ? 'ERR' : 'OK')}
                                </span>
                            </Td>
                            <Td className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{event.duration_label}</Td>
                            {isCommandList ? (
                                <>
                                    <Td className="font-mono">
                                        {(event.queries ?? 0).toLocaleString()}
                                    </Td>
                                    <Td className="font-mono">
                                        {event.peak_memory_label ?? '—'}
                                    </Td>
                                </>
                            ) : null}
                            <Td className="text-muted-foreground font-mono text-xs">
                                {event.server ?? '—'}
                            </Td>
                            <Td className="text-muted-foreground font-mono text-xs">
                                {event.occurred_at_label}
                            </Td>
                        </tr>
                    );
                })}
            </tbody>
        </DataTable>
    );
}
