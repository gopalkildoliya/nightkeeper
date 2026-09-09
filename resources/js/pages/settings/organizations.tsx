import { Head, Link, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { environmentPath, withRange } from '@/lib/range';
import { Building2, Plus, Layers, ShieldCheck, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';

type OrganizationListItem = {
    id: string;
    name: string;
    slug: string;
    role: string | null;
    applications: {
        id: string;
        name: string;
        environments: { id: string; name: string }[];
    }[];
};

type Props = {
    organizations: OrganizationListItem[];
};

export default function Organizations({ organizations }: Props) {
    const range = usePage().props.range.value;
    const flash = usePage().props.flash.success;

    const getEnvBadgeColor = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('prod')) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
        if (lower.includes('stag')) return 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20';
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    };

    return (
        <>
            <Head title="Organisations" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
                
                {/* Header with CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <Heading
                            title="Organisations"
                            description="Switch between organisations and applications you manage."
                        />
                    </div>
                    <Button asChild className="gap-1.5 shadow-sm">
                        <Link href="/organizations/create">
                            <Plus className="w-4 h-4" />
                            New Organisation
                        </Link>
                    </Button>
                </div>

                {flash ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>{flash}</span>
                    </div>
                ) : null}

                {organizations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-muted/20 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">No organisations yet</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1">Create an organisation to monitor your Laravel applications and queue workers.</p>
                        </div>
                        <Button asChild size="sm" className="mt-2">
                            <Link href="/organizations/create">Create Organisation</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {organizations.map((organization) => (
                            <Card
                                key={organization.id}
                                className="bg-card border-border shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group"
                            >
                                <CardHeader className="pb-3 border-b border-border/60">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                {organization.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <Link
                                                    href={`/organizations/${organization.id}`}
                                                    className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5"
                                                >
                                                    {organization.name}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {organization.role && (
                                                        <Badge variant="secondary" className="text-[10px] capitalize font-mono py-0 px-2">
                                                            {organization.role}
                                                        </Badge>
                                                    )}
                                                    <span className="text-[11px] font-mono text-muted-foreground">
                                                        {organization.applications.length} apps
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button asChild variant="outline" size="sm" className="text-xs gap-1">
                                            <Link href={`/organizations/${organization.id}`}>
                                                Settings
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-3 flex-1 flex flex-col justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1">
                                            <Layers className="w-3 h-3 text-cyan-500" />
                                            Monitored Environments
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {organization.applications.flatMap((application) =>
                                                application.environments.map((environment) => (
                                                    <Link
                                                        key={environment.id}
                                                        href={withRange(
                                                            environmentPath(
                                                                environment.id,
                                                                '/dashboard',
                                                            ),
                                                            range,
                                                        )}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium border hover:scale-105 transition-all ${getEnvBadgeColor(environment.name)}`}
                                                    >
                                                        <span>{application.name} / {environment.name}</span>
                                                        <ExternalLink className="w-3 h-3 opacity-60" />
                                                    </Link>
                                                )),
                                            )}
                                            {organization.applications.length === 0 && (
                                                <span className="text-xs text-muted-foreground italic">No environments created yet</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Organizations.layout = {
    breadcrumbs: [{ title: 'Organisations', href: '/organizations' }],
};
