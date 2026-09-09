import { Link } from '@inertiajs/react';
import type { Paginated } from '@/types/dashboard';

export function Pager<T>({ paginator }: { paginator: Paginated<T> }) {
    if (paginator.last_page <= 1) {
        return null;
    }

    return (
        <p className="text-muted-foreground mt-4 flex items-center gap-3 text-sm">
            {paginator.prev_page_url && (
                <Link href={paginator.prev_page_url} className="text-primary hover:underline">
                    Previous
                </Link>
            )}
            <span>
                Page {paginator.current_page} of {paginator.last_page}
            </span>
            {paginator.next_page_url && (
                <Link href={paginator.next_page_url} className="text-primary hover:underline">
                    Next
                </Link>
            )}
        </p>
    );
}
