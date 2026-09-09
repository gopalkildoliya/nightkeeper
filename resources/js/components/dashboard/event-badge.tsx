import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeStyles: Record<string, string> = {
    request: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold',
    command: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold',
    'job-attempt': 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold',
    'scheduled-task': 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold',
    action: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-semibold',
    query: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold',
    exception: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 font-semibold',
    'cache-event': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold',
    bootstrap: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold',
    'outgoing-request': 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-semibold',
    before_middleware: 'border-border bg-muted text-muted-foreground',
    after_middleware: 'border-border bg-muted text-muted-foreground',
};

export function EventBadge({ type }: { type: string }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs',
                typeStyles[type] ??
                    'border-border bg-muted text-muted-foreground',
            )}
        >
            {type.replaceAll('_', ' ')}
        </Badge>
    );
}

export function MethodBadge({ method }: { method?: string }) {
    if (!method) return null;
    const uppercaseMethod = method.toUpperCase();
    const styles: Record<string, string> = {
        GET: 'border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400',
        POST: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        PUT: 'border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-400',
        PATCH: 'border-orange-500/30 bg-orange-500/15 text-orange-800 dark:text-orange-400',
        DELETE: 'border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400',
    };

    return (
        <span
            className={cn(
                'inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border text-center min-w-[48px]',
                styles[uppercaseMethod] ?? 'border-border bg-muted text-muted-foreground'
            )}
        >
            {uppercaseMethod}
        </span>
    );
}
