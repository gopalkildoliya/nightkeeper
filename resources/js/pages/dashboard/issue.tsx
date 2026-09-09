import { Head } from '@inertiajs/react';
import { EventTable } from '@/components/dashboard/event-table';
import type { DashboardEvent, DashboardIssue } from '@/types/dashboard';

type IssueProps = {
    issue: DashboardIssue;
    events: DashboardEvent[];
};

export default function Issue({ issue, events }: IssueProps) {
    return (
        <>
            <Head title={issue.class} />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-lg font-semibold">{issue.class}</h1>
                <p className="text-muted-foreground">{issue.message}</p>
                {issue.file ? (
                    <p className="text-muted-foreground font-mono text-sm">
                        {issue.file}:{issue.line}
                    </p>
                ) : null}
                <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                    <span>
                        Occurrences{' '}
                        <b className="text-foreground">
                            {issue.occurrences.toLocaleString()}
                        </b>
                    </span>
                    <span>
                        Users{' '}
                        <b className="text-foreground">
                            {issue.users_affected.toLocaleString()}
                        </b>
                    </span>
                    <span>
                        First{' '}
                        <b className="text-foreground">
                            {issue.first_seen_label}
                        </b>
                    </span>
                    <span>
                        Last{' '}
                        <b className="text-foreground">{issue.last_seen_label}</b>
                    </span>
                </div>
                <h2 className="text-sm font-medium">Occurrences</h2>
                <EventTable events={events} />
            </div>
        </>
    );
}

Issue.layout = {
    breadcrumbs: [{ title: 'Issues', href: '/issues' }],
};
