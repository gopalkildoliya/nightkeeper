import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CsrfField } from '@/components/csrf-field';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { environmentPath, withRange } from '@/lib/range';
import { 
    Building2, 
    Users, 
    UserPlus, 
    Layers, 
    Plus, 
    Trash2, 
    ExternalLink, 
    Settings as SettingsIcon, 
    ShieldCheck, 
    User,
    CheckCircle2
} from 'lucide-react';

type Member = {
    id: number;
    name: string;
    email: string;
    role: string;
};

type Application = {
    id: string;
    name: string;
    environments: { id: string; name: string }[];
};

type Props = {
    organization: { id: string; name: string; slug: string };
    is_owner: boolean;
    members: Member[];
    applications: Application[];
};

export default function OrganizationShow({
    organization,
    is_owner,
    members,
    applications,
}: Props) {
    const range = usePage().props.range.value;
    const flash = usePage().props.flash.success;

    const getEnvBadgeColor = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('prod')) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
        if (lower.includes('stag')) return 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20';
        if (lower.includes('dev') || lower.includes('local')) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
        return 'bg-muted text-muted-foreground border-border';
    };

    return (
        <>
            <Head title={organization.name} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20">
                            {organization.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">{organization.name}</h1>
                                {is_owner && (
                                    <Badge variant="default" className="text-[10px] uppercase font-mono">
                                        <ShieldCheck className="w-3 h-3 mr-1 text-indigo-400" />
                                        Owner
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {organization.id} • slug: {organization.slug}</p>
                        </div>
                    </div>
                </div>

                {flash ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>{flash}</span>
                    </div>
                ) : null}

                {is_owner ? (
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/60">
                            <CardTitle className="text-sm font-semibold">Organisation name</CardTitle>
                            <CardDescription>Display name for this organisation. The slug used in URLs does not change.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5">
                            <Form
                                action={`/organizations/${organization.id}`}
                                method="patch"
                                className="flex max-w-md items-start gap-2"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <CsrfField />
                                        <div className="grid flex-1 gap-1">
                                            <Label htmlFor="organization-name" className="text-xs font-medium">
                                                Name
                                            </Label>
                                            <Input
                                                id="organization-name"
                                                name="name"
                                                defaultValue={organization.name}
                                                required
                                                maxLength={255}
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

                {/* Team Members Section */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="border-b border-border/60">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                Team Members ({members.length})
                            </CardTitle>
                        </div>
                        <CardDescription>
                            People who have access to applications and environments in this organisation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-border/60">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-muted/30"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center text-xs font-mono border border-indigo-500/20">
                                        {member.name ? member.name.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                                            {member.name}
                                            <Badge
                                                variant={member.role === 'owner' ? 'default' : 'secondary'}
                                                className="text-[10px] font-mono capitalize py-0 px-2"
                                            >
                                                {member.role}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono">{member.email}</div>
                                    </div>
                                </div>

                                {is_owner && member.role !== 'owner' ? (
                                    <Form
                                        action={`/organizations/${organization.id}/members/${member.id}`}
                                        method="delete"
                                    >
                                        {({ processing }) => (
                                            <>
                                                <CsrfField />
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={processing}
                                                    className="text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                    Remove
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                ) : null}
                            </div>
                        ))}

                        {/* Add Member Form */}
                        {is_owner ? (
                            <div className="p-6 bg-muted/20 border-t border-border">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                                    <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
                                    Add New Teammate
                                </h4>
                                <Form
                                    action={`/organizations/${organization.id}/members`}
                                    method="post"
                                    className="flex max-w-md items-start gap-2"
                                    resetOnSuccess
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <CsrfField />
                                            <div className="grid flex-1 gap-1.5">
                                                <Label htmlFor="email" className="sr-only">Email address</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    placeholder="teammate@company.com"
                                                    className="h-9 text-xs"
                                                />
                                                <InputError message={errors.email} />
                                            </div>
                                            <Button type="submit" size="sm" disabled={processing} className="h-9">
                                                Add Member
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Applications & Environments Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <Layers className="w-4 h-4 text-cyan-500" />
                                Applications & Environments
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Application telemetry targets monitored by Nightkeeper</p>
                        </div>
                    </div>

                    {applications.map((application) => (
                        <Card key={application.id} className="bg-card border-border shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/60">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/20 font-mono">
                                            {application.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold">{application.name}</CardTitle>
                                            <CardDescription className="text-[11px] font-mono">{application.environments.length} environments configured</CardDescription>
                                        </div>
                                    </div>
                                    {is_owner ? (
                                        <Form
                                            action={`/organizations/${organization.id}/applications/${application.id}`}
                                            method="delete"
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <CsrfField />
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={processing}
                                                        className="text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                        Delete App
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    ) : null}
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                {is_owner ? (
                                    <Form
                                        action={`/organizations/${organization.id}/applications/${application.id}`}
                                        method="patch"
                                        className="flex max-w-md items-start gap-2"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <CsrfField />
                                                <div className="grid flex-1 gap-1">
                                                    <Label htmlFor={`application-name-${application.id}`} className="text-xs font-medium">
                                                        Application name
                                                    </Label>
                                                    <Input
                                                        id={`application-name-${application.id}`}
                                                        name="name"
                                                        defaultValue={application.name}
                                                        required
                                                        maxLength={255}
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
                                ) : null}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {application.environments.map((environment) => (
                                        <div
                                            key={environment.id}
                                            className="flex flex-col justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${getEnvBadgeColor(environment.name)}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {environment.name}
                                                </span>
                                                <Link
                                                    href={environmentPath(
                                                        environment.id,
                                                        '/settings',
                                                    )}
                                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                                                    title="Environment Settings & Tokens"
                                                >
                                                    <SettingsIcon className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                            <Link
                                                href={withRange(
                                                    environmentPath(
                                                        environment.id,
                                                        '/dashboard',
                                                    ),
                                                    range,
                                                )}
                                                className="inline-flex items-center justify-between text-xs font-semibold text-primary group-hover:underline pt-2 border-t border-border/40"
                                            >
                                                <span>View Dashboard</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>

                                {is_owner ? (
                                    <div className="pt-2">
                                        <Form
                                            action={`/applications/${application.id}/environments`}
                                            method="post"
                                            className="flex max-w-md items-start gap-2"
                                            resetOnSuccess
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    <CsrfField />
                                                    <div className="grid flex-1 gap-1">
                                                        <Label htmlFor={`env-${application.id}`} className="text-xs font-medium text-muted-foreground">
                                                            + Add Environment to {application.name}
                                                        </Label>
                                                        <Input
                                                            id={`env-${application.id}`}
                                                            name="name"
                                                            required
                                                            placeholder="Staging / Production / Testing"
                                                            className="h-8 text-xs"
                                                        />
                                                        <InputError message={errors.name} />
                                                    </div>
                                                    <Button type="submit" size="sm" variant="secondary" disabled={processing} className="h-8 mt-[17px]">
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Create New Application Card */}
                    {is_owner ? (
                        <Card className="bg-card border-dashed border-border shadow-xs">
                            <CardContent className="p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5 text-primary" />
                                    Create New Application
                                </h3>
                                <Form
                                    action={`/organizations/${organization.id}/applications`}
                                    method="post"
                                    className="flex max-w-md items-start gap-2"
                                    resetOnSuccess
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <CsrfField />
                                            <div className="grid flex-1 gap-1">
                                                <Label htmlFor="application-name" className="sr-only">Application name</Label>
                                                <Input
                                                    id="application-name"
                                                    name="name"
                                                    required
                                                    placeholder="API Gateway / Frontend App"
                                                    className="h-9 text-xs"
                                                />
                                                <InputError message={errors.name} />
                                            </div>
                                            <Button type="submit" size="sm" disabled={processing} className="h-9">
                                                Create App
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>
        </>
    );
}

OrganizationShow.layout = {
    breadcrumbs: [{ title: 'Organisations', href: '/organizations' }],
};
