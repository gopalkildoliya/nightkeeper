import { Head } from '@inertiajs/react';
import { EventTable } from '@/components/dashboard/event-table';
import { Pager } from '@/components/dashboard/pager';
import type { DashboardEvent, Paginated } from '@/types/dashboard';

type EventsProps = {
    heading: string;
    events: Paginated<DashboardEvent>;
};

export default function Events({ heading, events }: EventsProps) {
    return (
        <>
            <Head title={heading} />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-lg font-semibold">{heading}</h1>
                <EventTable events={events.data} />
                <Pager paginator={events} />
            </div>
        </>
    );
}

Events.layout = {
    breadcrumbs: [{ title: 'Commands', href: '/commands' }],
};
