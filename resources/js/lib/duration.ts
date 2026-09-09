export function durationLabel(microseconds: number | null | undefined): string {
    if (microseconds === null || microseconds === undefined) {
        return '—';
    }

    const us = Math.round(microseconds);

    if (us < 1000) {
        return `${us} µs`;
    }

    if (us < 1_000_000) {
        const ms = us < 10_000 ? Math.round(us / 100) / 10 : Math.round(us / 1000);

        return `${ms} ms`;
    }

    return `${(us / 1_000_000).toFixed(2)} s`;
}
