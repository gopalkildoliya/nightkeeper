import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DataTable({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-xs border-collapse">{children}</table>
        </div>
    );
}

export function TableHead({ children }: { children: ReactNode }) {
    return (
        <thead>
            <tr className="border-b border-border bg-muted/60 text-left text-[10px] tracking-wider text-muted-foreground uppercase font-mono">
                {children}
            </tr>
        </thead>
    );
}

export function Th({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return <th className={cn('px-4 py-3 font-semibold', className)}>{children}</th>;
}

export function Td({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <td className={cn('border-b border-border/60 px-4 py-3 align-middle text-foreground', className)}>
            {children}
        </td>
    );
}

export function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/30">
            <p className="text-muted-foreground text-sm font-medium">{children}</p>
        </div>
    );
}

export function MonoLink({
    href,
    children,
    className,
}: {
    href: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'font-mono text-primary hover:underline transition-colors font-medium',
                className,
            )}
        >
            {children}
        </Link>
    );
}

export function LatencyBar({ pct, label, color = "text-amber-600 dark:text-amber-400" }: { pct: number; label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2 font-mono text-xs">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0 border border-border/40">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                />
            </div>
            <span className={cn('font-semibold', color)}>{label}</span>
        </div>
    );
}
