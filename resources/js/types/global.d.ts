import type { Auth } from '@/types/auth';

export type SharedOrganization = {
    id: string;
    name: string;
    slug: string;
};

export type SharedApplication = {
    id: string;
    name: string;
    organization_id: string;
};

export type SharedEnvironment = {
    id: string;
    name: string;
    application_id: string;
};

export type SwitcherEnvironment = {
    id: string;
    name: string;
    application: string;
    organization: string;
};

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            range: {
                value: string;
                label: string;
            };
            openIssueCount: number;
            currentOrganization: SharedOrganization | null;
            currentApplication: SharedApplication | null;
            currentEnvironment: SharedEnvironment | null;
            isOwner: boolean;
            switcher: SwitcherEnvironment[];
            flash: {
                success: string | null;
            };
            csrf_token: string;
            [key: string]: unknown;
        };
    }
}
