import { Head, usePage } from '@inertiajs/react';
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
import { cn } from '@/lib/utils';
import type { EventGroup, Paginated } from '@/types/dashboard';

type Kind = 'request' | 'query' | 'job' | 'exception' | 'command';

type GroupsProps = {
    heading: string;
    kind: Kind;
    groups: Paginated<EventGroup>;
};

const emptyCopy: Record<Kind, string> = {
    request: 'No requests in this range.',
    query: 'No queries in this range.',
    job: 'No job attempts in this range.',
    exception: 'No exceptions in this range.',
    command: 'No commands in this range.',
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

export default function Groups({ heading, kind, groups }: GroupsProps) {
    const { range, currentEnvironment } = usePage().props;
    const environmentId = currentEnvironment?.id ?? '';

    return (
        <>
            <Head title={heading} />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-lg font-semibold">{heading}</h1>
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
