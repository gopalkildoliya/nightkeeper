import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

const tabs = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
] as const;

export function RangeTabs() {
    const page = usePage();
    const current = page.props.range.value;
    const pathname = new URL(page.url, 'http://localhost').pathname;

    return (
        <div className="ml-auto flex gap-1 rounded-lg border p-1">
            {tabs.map((tab) => (
                <Link
                    key={tab.value}
                    href={`${pathname}?range=${tab.value}`}
                    className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium',
                        current === tab.value
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : 'text-muted-foreground hover:bg-muted',
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
