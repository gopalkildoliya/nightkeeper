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
