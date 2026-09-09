import { Form, Head } from '@inertiajs/react';
import { CsrfField } from '@/components/csrf-field';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function OrganizationCreate() {
    return (
        <>
            <Head title="New organisation" />
            <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6 my-6">
                
                <Card className="bg-card border-border shadow-md">
                    <CardHeader className="text-center pb-4 border-b border-border/60">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/25 mb-2">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight text-foreground">Create Organisation</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Set up an organisation workspace to group your applications and environments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        
                        {/* Auto-configured items badge */}
                        <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                Automatically Provisioned:
                            </div>
                            <ul className="space-y-1 text-muted-foreground pl-5 list-disc">
                                <li><strong className="text-foreground">Default Application</strong> target</li>
                                <li><strong className="text-foreground">Production Environment</strong> & Ingest Tokens</li>
                            </ul>
                        </div>

                        <Form
                            action="/organizations"
                            method="post"
                            className="flex flex-col gap-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <CsrfField />
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-xs font-semibold">Organisation Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            autoFocus
                                            placeholder="e.g. Acme Corp / Billing Service"
                                            className="h-10 text-sm"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <Button type="submit" disabled={processing} className="w-full h-10 shadow-sm font-semibold mt-2">
                                        {processing && <Spinner className="mr-2" />}
                                        Create Organisation
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OrganizationCreate.layout = {
    breadcrumbs: [
        { title: 'Organisations', href: '/organizations' },
        { title: 'Create', href: '/organizations/create' },
    ],
};
