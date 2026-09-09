export type TimeRangeValue = '1h' | '24h' | '7d';

export type EventGroup = {
    group_hash: string;
    label: string;
    occurrences: number;
    avg_us: number | null;
    p95_us: number | null;
    max_us: number | null;
    min_us: number | null;
    avg_label: string;
    p95_label: string;
    max_label: string;
    min_label: string;
    last_seen_at: number;
    last_seen_label: string;
    counts: Record<string, number>;
    users_affected: number;
    sample_trace_id: string | null;
    meta: {
        class?: string | null;
        file?: string | null;
        line?: number | null;
        message?: string | null;
        connection?: string | null;
        sql?: string | null;
        name?: string | null;
        host?: string | null;
        store?: string | null;
        key?: string | null;
        mailer?: string | null;
        subject?: string | null;
        channel?: string | null;
        cron?: string | null;
        timezone?: string | null;
    };
};

export type DashboardEvent = {
    id: number;
    t: string;
    title: string;
    status_label: string;
    duration_label: string;
    occurred_at_label: string;
    is_error: boolean;
    trace_id: string | null;
    server: string | null;
    class?: string | null;
    command_line?: string | null;
    queries?: number | null;
    exceptions?: number | null;
    peak_memory_label?: string;
    cron?: string | null;
    payload?: Record<string, unknown>;
};

export type DashboardIssue = {
    id: number;
    class: string;
    message: string;
    file: string | null;
    line: number | null;
    occurrences: number;
    users_affected: number;
    status: string;
    first_seen_label: string;
    last_seen_label: string;
    group_hash: string;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type RequestBucket = {
    start: number;
    label: string;
    total: number;
    xx123: number;
    xx4: number;
    xx5: number;
    avg_us: number | null;
};

export type VolumeBucket = {
    start: number;
    label: string;
    total: number;
    segments: Record<string, number>;
};

export type TraceSpan = {
    t: string;
    title: string;
    duration_us: number;
    duration_label: string;
    kind: string;
    left: number;
    width: number;
};
