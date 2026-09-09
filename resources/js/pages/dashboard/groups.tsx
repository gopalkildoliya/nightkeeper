import { Head, usePage } from '@inertiajs/react';
import {
    DataTable,
    EmptyState,
    MonoLink,
    TableHead,
    Td,
    Th,
} from '@/components/dashboard/data-table';
import { PanelVolumeChart } from '@/components/dashboard/panel-volume-chart';
import { Pager } from '@/components/dashboard/pager';
import { environmentPath, withRange } from '@/lib/range';
import { cn } from '@/lib/utils';
import type { EventGroup, Paginated, VolumeBucket } from '@/types/dashboard';

type Kind =
    | 'request'
    | 'query'
    | 'job'
    | 'exception'
    | 'command'
    | 'scheduled-task'
    | 'outgoing-request'
    | 'cache'
    | 'mail'
    | 'notification';

type GroupsProps = {
    heading: string;
    kind: Kind;
    groups: Paginated<EventGroup>;
    buckets?: VolumeBucket[];
};

const emptyCopy: Record<Kind, string> = {
    request: 'No requests in this range.',
    query: 'No queries in this range.',
    job: 'No job attempts in this range.',
    exception: 'No exceptions in this range.',
    command: 'No commands in this range.',
    'scheduled-task': 'No scheduled tasks in this range.',
    'outgoing-request': 'No outgoing requests in this range.',
    cache: 'No cache events in this range.',
    mail: 'No mail in this range.',
    notification: 'No notifications in this range.',
};

function matchPath(environmentId: string, kind: Kind, groupHash: string): string {
    switch (kind) {
        case 'request':
            return environmentPath(environmentId, `/requests/${groupHash}`);
        case 'query':
            return environmentPath(environmentId, `/queries/${groupHash}`);
        case 'job':
            return environmentPath(environmentId, `/jobs/${groupHash}`);
        case 'exception':
            return environmentPath(environmentId, `/exceptions/${groupHash}`);
        case 'command':
            return environmentPath(environmentId, `/commands/${groupHash}`);
        case 'scheduled-task':
            return environmentPath(environmentId, `/scheduled-tasks/${groupHash}`);
        case 'outgoing-request':
            return environmentPath(environmentId, `/outgoing-requests/${groupHash}`);
        case 'cache':
            return environmentPath(environmentId, `/cache/${groupHash}`);
        case 'mail':
            return environmentPath(environmentId, `/mail/${groupHash}`);
        case 'notification':
            return environmentPath(environmentId, `/notifications/${groupHash}`);
    }
}

function GroupColumns({
    kind,
    groups,
    range,
    environmentId,
}: {
    kind: Kind;
    groups: EventGroup[];
    range: string;
    environmentId: string;
}) {
    if (kind === 'request') {
        return (
            <>
                <TableHead>
                    <Th>Route</Th>
                    <Th>Requests</Th>
                    <Th>2xx</Th>
                    <Th>4xx</Th>
                    <Th>5xx</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl truncate font-mono">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                            </Td>
                            <Td>{group.occurrences.toLocaleString()}</Td>
                            <Td>
                                {(group.counts.xx123 ?? 0).toLocaleString()}
                            </Td>
                            <Td>{(group.counts.xx4 ?? 0).toLocaleString()}</Td>
                            <Td
                                className={cn(
                                    (group.counts.xx5 ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.xx5 ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'query') {
        return (
            <>
                <TableHead>
                    <Th>SQL</Th>
                    <Th>Calls</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl truncate font-mono">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                            </Td>
                            <Td>{group.occurrences.toLocaleString()}</Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'job') {
        return (
            <>
                <TableHead>
                    <Th>Job</Th>
                    <Th>Attempts</Th>
                    <Th>Processed</Th>
                    <Th>Failed</Th>
                    <Th>Released</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl truncate font-mono">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                            </Td>
                            <Td>{group.occurrences.toLocaleString()}</Td>
                            <Td>
                                {(group.counts.processed ?? 0).toLocaleString()}
                            </Td>
                            <Td
                                className={cn(
                                    (group.counts.failed ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.failed ?? 0).toLocaleString()}
                            </Td>
                            <Td>
                                {(group.counts.released ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'command') {
        return (
            <>
                <TableHead>
                    <Th>Command</Th>
                    <Th>Runs</Th>
                    <Th>Succeeded</Th>
                    <Th>Failed</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                    <Th>Last seen</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                                {group.meta.class ? (
                                    <div className="text-muted-foreground max-w-xl truncate font-mono text-xs">
                                        {group.meta.class}
                                    </div>
                                ) : null}
                            </Td>
                            <Td>{group.occurrences.toLocaleString()}</Td>
                            <Td>
                                {(group.counts.succeeded ?? 0).toLocaleString()}
                            </Td>
                            <Td
                                className={cn(
                                    (group.counts.failed ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.failed ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                            <Td className="text-muted-foreground font-mono">
                                {group.last_seen_label}
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'scheduled-task') {
        return (
            <>
                <TableHead>
                    <Th>Task</Th>
                    <Th>Runs</Th>
                    <Th>Processed</Th>
                    <Th>Failed</Th>
                    <Th>Skipped</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                    <Th>Last seen</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                                {group.meta.cron ? (
                                    <div className="text-muted-foreground max-w-xl truncate font-mono text-xs">
                                        {group.meta.cron}
                                        {group.meta.timezone ? ` ${group.meta.timezone}` : ''}
                                    </div>
                                ) : null}
                            </Td>
                            <Td>{group.occurrences.toLocaleString()}</Td>
                            <Td>
                                {(group.counts.processed ?? 0).toLocaleString()}
                            </Td>
                            <Td
                                className={cn(
                                    (group.counts.failed ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.failed ?? 0).toLocaleString()}
                            </Td>
                            <Td>
                                {(group.counts.skipped ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                            <Td className="text-muted-foreground font-mono">
                                {group.last_seen_label}
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'outgoing-request') {
        return (
            <>
                <TableHead>
                    <Th>Host</Th>
                    <Th>Calls</Th>
                    <Th>2xx</Th>
                    <Th>4xx</Th>
                    <Th>5xx</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl truncate font-mono">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                            </Td>
                            <Td>{group.occurrences.toLocaleString()}</Td>
                            <Td>
                                {(group.counts.xx123 ?? 0).toLocaleString()}
                            </Td>
                            <Td>{(group.counts.xx4 ?? 0).toLocaleString()}</Td>
                            <Td
                                className={cn(
                                    (group.counts.xx5 ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.xx5 ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'cache') {
        return (
            <>
                <TableHead>
                    <Th>Key</Th>
                    <Th>Hits</Th>
                    <Th>Misses</Th>
                    <Th>Writes</Th>
                    <Th>Deletes</Th>
                    <Th>Failures</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                                {group.meta.store ? (
                                    <div className="text-muted-foreground max-w-xl truncate font-mono text-xs">
                                        {group.meta.store}
                                    </div>
                                ) : null}
                            </Td>
                            <Td>{(group.counts.hit ?? 0).toLocaleString()}</Td>
                            <Td>{(group.counts.miss ?? 0).toLocaleString()}</Td>
                            <Td>{(group.counts.write ?? 0).toLocaleString()}</Td>
                            <Td>{(group.counts.delete ?? 0).toLocaleString()}</Td>
                            <Td
                                className={cn(
                                    (group.counts.failures ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.failures ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'mail') {
        return (
            <>
                <TableHead>
                    <Th>Mailable</Th>
                    <Th>Sent</Th>
                    <Th>Failed</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                    <Th>Last seen</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                                {group.meta.subject ? (
                                    <div className="text-muted-foreground max-w-xl truncate text-xs">
                                        {group.meta.subject}
                                    </div>
                                ) : null}
                                {group.meta.mailer ? (
                                    <div className="text-muted-foreground max-w-xl truncate font-mono text-xs">
                                        {group.meta.mailer}
                                    </div>
                                ) : null}
                            </Td>
                            <Td>{(group.counts.sent ?? 0).toLocaleString()}</Td>
                            <Td
                                className={cn(
                                    (group.counts.failed ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.failed ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                            <Td className="text-muted-foreground font-mono">
                                {group.last_seen_label}
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    if (kind === 'notification') {
        return (
            <>
                <TableHead>
                    <Th>Notification</Th>
                    <Th>Sent</Th>
                    <Th>Failed</Th>
                    <Th>Avg</Th>
                    <Th>P95</Th>
                    <Th>Last seen</Th>
                </TableHead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.group_hash}>
                            <Td className="max-w-xl">
                                <MonoLink
                                    href={withRange(
                                        matchPath(environmentId, kind, group.group_hash),
                                        range,
                                    )}
                                >
                                    {group.label}
                                </MonoLink>
                                {group.meta.channel ? (
                                    <div className="text-muted-foreground max-w-xl truncate font-mono text-xs">
                                        {group.meta.channel}
                                    </div>
                                ) : null}
                            </Td>
                            <Td>{(group.counts.sent ?? 0).toLocaleString()}</Td>
                            <Td
                                className={cn(
                                    (group.counts.failed ?? 0) > 0 &&
                                        'text-destructive',
                                )}
                            >
                                {(group.counts.failed ?? 0).toLocaleString()}
                            </Td>
                            <Td className="font-mono">{group.avg_label}</Td>
                            <Td className="font-mono">{group.p95_label}</Td>
                            <Td className="text-muted-foreground font-mono">
                                {group.last_seen_label}
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </>
        );
    }

    return (
        <>
            <TableHead>
                <Th>Exception</Th>
                <Th>Occurrences</Th>
                <Th>Users</Th>
                <Th>Unhandled</Th>
                <Th>Last seen</Th>
            </TableHead>
            <tbody>
                {groups.map((group) => (
                    <tr key={group.group_hash}>
                        <Td>
                            <MonoLink
                                href={withRange(
                                    matchPath(environmentId, kind, group.group_hash),
                                    range,
                                )}
                            >
                                {group.meta.class ?? group.label}
                            </MonoLink>
                            <div className="text-muted-foreground max-w-xl truncate">
                                {group.meta.message ?? group.label}
                            </div>
                            {group.meta.file ? (
                                <div className="text-muted-foreground font-mono text-xs">
                                    {group.meta.file}:{group.meta.line}
                                </div>
                            ) : null}
                        </Td>
                        <Td>{group.occurrences.toLocaleString()}</Td>
                        <Td>{group.users_affected.toLocaleString()}</Td>
                        <Td
                            className={cn(
                                (group.counts.unhandled ?? 0) > 0
                                    ? 'text-destructive'
                                    : 'text-emerald-600 dark:text-emerald-400',
                            )}
                        >
                            {(group.counts.unhandled ?? 0).toLocaleString()}
                        </Td>
                        <Td className="text-muted-foreground font-mono">
                            {group.last_seen_label}
                        </Td>
                    </tr>
                ))}
            </tbody>
        </>
    );
}

export default function Groups({ heading, kind, groups, buckets }: GroupsProps) {
    const { range, currentEnvironment } = usePage().props;
    const environmentId = currentEnvironment?.id ?? '';

    return (
        <>
            <Head title={heading} />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
                <h1 className="text-lg font-semibold">{heading}</h1>
                {buckets ? (
                    <PanelVolumeChart kind={kind} buckets={buckets} />
                ) : null}
                {groups.data.length === 0 ? (
                    <EmptyState>{emptyCopy[kind]}</EmptyState>
                ) : (
                    <>
                        <DataTable>
                            <GroupColumns
                                kind={kind}
                                groups={groups.data}
                                range={range.value}
                                environmentId={environmentId}
                            />
                        </DataTable>
                        <Pager paginator={groups} />
                    </>
                )}
            </div>
        </>
    );
}

Groups.layout = {
    breadcrumbs: [{ title: 'Groups', href: '/requests' }],
};
