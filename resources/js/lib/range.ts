export function withRange(path: string, range: string): string {
    const [pathname] = path.split('?');

    return `${pathname}?range=${encodeURIComponent(range)}`;
}

export function environmentPath(environmentId: string, suffix: string): string {
    const path = suffix.startsWith('/') ? suffix : `/${suffix}`;

    return `/environments/${environmentId}${path}`;
}

export function hrefPath(
    href: string | { url: string } | undefined,
): string {
    const url = typeof href === 'string' ? href : (href?.url ?? '/');
    const path = url.split('?')[0];

    return path === '' ? '/' : path;
}
