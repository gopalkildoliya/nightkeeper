export function chartTickSeconds(starts: number[]): number {
    if (starts.length < 2) {
        return 60;
    }

    return Math.max(1, starts[1] - starts[0]);
}

export function axisLabelInterval(tickSeconds: number): number {
    if (tickSeconds <= 60) {
        return 600;
    }

    if (tickSeconds <= 900) {
        return 14_400;
    }

    return 86_400;
}

export function shouldShowAxisLabel(start: number, interval: number): boolean {
    return start % interval === 0;
}

export function formatAxisLabel(start: number, tickSeconds: number): string {
    const date = new Date(start * 1000);

    if (tickSeconds <= 900) {
        return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    });
}
