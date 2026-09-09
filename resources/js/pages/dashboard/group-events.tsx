import { Head } from '@inertiajs/react';
import { EventTable } from '@/components/dashboard/event-table';
import type { DashboardEvent, EventGroup } from '@/types/dashboard';

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
    return (
        <>
            <Head title={heading} />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-lg font-semibold">{heading}</h1>
                {group && (
                    <div className="text-muted-foreground space-y-1 text-sm">
                        <p>
                            {group.occurrences.toLocaleString()} occurrences · avg{' '}
                            {group.avg_label} · p95 {group.p95_label}
                            {'succeeded' in group.counts
                                ? ` · ${group.counts.succeeded.toLocaleString()} succeeded · ${(group.counts.failed ?? 0).toLocaleString()} failed`
                                : ''}
                            {'processed' in group.counts
                                ? ` · ${(group.counts.processed ?? 0).toLocaleString()} processed · ${(group.counts.failed ?? 0).toLocaleString()} failed`
                                : ''}
                            {'sent' in group.counts
                                ? ` · ${(group.counts.sent ?? 0).toLocaleString()} sent · ${(group.counts.failed ?? 0).toLocaleString()} failed`
                                : ''}
                            {'hit' in group.counts
                                ? ` · ${(group.counts.hit ?? 0).toLocaleString()} hits · ${(group.counts.miss ?? 0).toLocaleString()} misses`
                                : ''}
                            {'xx123' in group.counts
                                ? ` · ${(group.counts.xx123 ?? 0).toLocaleString()} 2xx · ${(group.counts.xx4 ?? 0).toLocaleString()} 4xx · ${(group.counts.xx5 ?? 0).toLocaleString()} 5xx`
                                : ''}
                        </p>
                        {group.meta.class ? (
                            <p className="font-mono text-xs">{group.meta.class}</p>
                        ) : null}
                    </div>
                )}
                <EventTable events={events} />
            </div>
        </>
    );
}

GroupEvents.layout = {
    breadcrumbs: [{ title: 'Occurrences', href: '/requests' }],
};
