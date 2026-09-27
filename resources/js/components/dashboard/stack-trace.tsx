import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import type { ExceptionFrame } from '@/types/dashboard';

function parseLocation(file: string | null): { path: string; line: number | null } {
    if (!file) {
        return { path: 'unknown', line: null };
    }

    const separator = file.lastIndexOf(':');
    if (separator === -1) {
        return { path: file, line: null };
    }

    const line = Number(file.slice(separator + 1));

    return Number.isFinite(line) ? { path: file.slice(0, separator), line } : { path: file, line: null };
}

function isVendorFrame(file: string | null): boolean {
    return !!file && (file.includes('/vendor/') || file === '[internal function]');
}

function CodeSnippet({ code, line }: { code: Record<string, string>; line: number | null }) {
    const rows = Object.entries(code).sort((a, b) => Number(a[0]) - Number(b[0]));

    return (
        <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 py-1.5 text-xs leading-relaxed">
            <code className="grid">
                {rows.map(([lineNo, text]) => (
                    <span
                        key={lineNo}
                        className={cn(
                            'grid grid-cols-[3rem_1fr] gap-3 px-3 py-0.5',
                            Number(lineNo) === line ? 'bg-red-500/15 text-red-200' : 'text-slate-400',
                        )}
                    >
                        <span className="text-right text-slate-600 select-none">{lineNo}</span>
                        <span className="whitespace-pre text-slate-100">{text}</span>
                    </span>
                ))}
            </code>
        </pre>
    );
}

export function StackTrace({ frames }: { frames: ExceptionFrame[] }) {
    const [showVendorFrames, setShowVendorFrames] = useState(false);
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);

    if (frames.length === 0) {
        return (
            <p className="text-muted-foreground text-sm italic">
                No stack trace was captured for this occurrence.
            </p>
        );
    }

    const hiddenCount = frames.filter((frame) => !frame.code && isVendorFrame(frame.file)).length;
    const visibleFrames = showVendorFrames ? frames : frames.filter((frame) => frame.code || !isVendorFrame(frame.file));

    const handleCopy = () => {
        const text = frames
            .map((frame, index) => `#${index} ${frame.file ?? 'unknown'}${frame.source ? `\n    ${frame.source}` : ''}`)
            .join('\n\n');
        void copy(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                    {frames.length} frame{frames.length === 1 ? '' : 's'}
                    {hiddenCount > 0 && !showVendorFrames
                        ? ` · ${hiddenCount} vendor frame${hiddenCount === 1 ? '' : 's'} hidden`
                        : null}
                </div>
                <div className="flex items-center gap-2">
                    {hiddenCount > 0 ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowVendorFrames((value) => !value)}
                        >
                            {showVendorFrames ? 'Hide vendor frames' : 'Show vendor frames'}
                        </Button>
                    ) : null}
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy trace'}
                    </Button>
                </div>
            </div>

            <ol className="space-y-1.5">
                {visibleFrames.map((frame, index) => {
                    const { path, line } = parseLocation(frame.file);
                    const vendor = isVendorFrame(frame.file);

                    if (!frame.code) {
                        return (
                            <li
                                key={index}
                                className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 font-mono text-xs text-muted-foreground"
                            >
                                <span className="text-muted-foreground/60 select-none">#{index}</span>
                                <span className="min-w-0 flex-1 truncate">
                                    {path}
                                    {line ? `:${line}` : ''}
                                    {frame.source ? <span className="ml-2 text-muted-foreground/80">{frame.source}</span> : null}
                                </span>
                            </li>
                        );
                    }

                    return (
                        <li
                            key={index}
                            className={cn(
                                'rounded-lg border p-3',
                                vendor ? 'border-border/60 bg-muted/20' : 'border-red-500/20 bg-red-500/5',
                            )}
                        >
                            <div className="flex items-center gap-2 font-mono text-xs">
                                <span className="text-muted-foreground/60 select-none">#{index}</span>
                                <span className={cn('font-semibold', vendor ? 'text-foreground' : 'text-red-700 dark:text-red-400')}>
                                    {path}
                                    {line ? `:${line}` : ''}
                                </span>
                            </div>
                            {frame.source ? (
                                <div className="mt-1 truncate pl-5 font-mono text-xs text-muted-foreground">{frame.source}</div>
                            ) : null}
                            <div className="mt-2">
                                <CodeSnippet code={frame.code} line={line} />
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
