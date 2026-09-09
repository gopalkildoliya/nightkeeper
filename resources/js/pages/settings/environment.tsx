import { Form, Head } from '@inertiajs/react';
import { CsrfField } from '@/components/csrf-field';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import { Key, Copy, RotateCw, Check, Terminal, Layers, Building2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

type Props = {
    environment: { id: string; name: string; application_id: string };
    application: { id: string; name: string };
    organization: { id: string; name: string };
    token: string | null;
    can_update: boolean;
    can_rotate: boolean;
    base_url: string;
    success?: string | null;
};

export default function EnvironmentSettings({
    environment,
    application,
    organization,
    token,
    can_update,
    can_rotate,
    base_url,
    success,
}: Props) {
    const [, copy] = useClipboard();
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedSnippet, setCopiedSnippet] = useState(false);

    const snippet = token
        ? `NIGHTWATCH_ENABLED=true\nNIGHTWATCH_BASE_URL=${base_url}\nNIGHTWATCH_TOKEN=${token}`
        : `NIGHTWATCH_ENABLED=true\nNIGHTWATCH_BASE_URL=${base_url}\nNIGHTWATCH_TOKEN=<ask an owner>`;

    const handleCopyToken = () => {
        if (!token) return;
        void copy(token);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    const handleCopySnippet = () => {
        void copy(snippet);
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
    };

    return (
        <>
            <Head title={`${environment.name} settings`} />
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-indigo-500" /> {organization.name}</span>
                            <span>/</span>
                            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-cyan-500" /> {application.name}</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            {environment.name} Environment
                            <Badge variant="outline" className="text-xs font-mono">
                                Settings & Keys
                            </Badge>
                        </h1>
                    </div>
                </div>

                {success ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>{success}</span>
                    </div>
                ) : null}

                {/* Edit Name Card */}
                {can_update ? (
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/60">
                            <CardTitle className="text-sm font-semibold">Environment Properties</CardTitle>
                            <CardDescription>Display name for this environment target.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5">
                            <Form
                                action={`/environments/${environment.id}`}
                                method="patch"
                                className="flex max-w-md items-start gap-2"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <CsrfField />
                                        <div className="grid flex-1 gap-1">
                                            <Label htmlFor="name" className="text-xs font-medium">Environment Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                defaultValue={environment.name}
                                                required
                                                className="h-9 text-xs"
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <Button type="submit" size="sm" disabled={processing} className="h-9 mt-[21px]">
                                            Save Name
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Environment Ingest Token Card */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/60">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Key className="w-4 h-4 text-amber-500" />
                                Environment Ingest Token
                            </CardTitle>
                            {can_rotate && (
                                <Badge variant="outline" className="text-[10px] font-mono text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10">
                                    Confidential Key
                                </Badge>
                            )}
                        </div>
                        <CardDescription>
                            Authentication token used by `php artisan nightwatch:agent` to stream telemetry.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        {token ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={token}
                                        className="font-mono text-xs bg-slate-950 text-amber-400 border-slate-800 focus-visible:ring-0"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyToken}
                                        className="gap-1.5 min-w-[90px]"
                                    >
                                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedToken ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>

                                {can_rotate ? (
                                    <div className="pt-2 flex items-center justify-between border-t border-border/60">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                            Rotating invalidates active agent connections using the previous key.
                                        </div>
                                        <Form
                                            action={`/environments/${environment.id}/token`}
                                            method="post"
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <CsrfField />
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={processing}
                                                        className="text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
                                                    >
                                                        <RotateCw className="w-3.5 h-3.5" />
                                                        Rotate Token
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-xs italic">
                                Only organisation owners can view or rotate the environment ingest token.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Setup Snippet Card */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/60">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-500" />
                                Agent Configuration Snippet (.env)
                            </CardTitle>
                            {token && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopySnippet}
                                    className="gap-1.5"
                                >
                                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedSnippet ? 'Copied Snippet!' : 'Copy Snippet'}
                                </Button>
                            )}
                        </div>
                        <CardDescription>
                            Paste these environment variables into your target Laravel app's `.env` file.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                        <pre className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 leading-relaxed">
                            {snippet}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EnvironmentSettings.layout = {
    breadcrumbs: [{ title: 'Environment Settings', href: '#' }],
};
