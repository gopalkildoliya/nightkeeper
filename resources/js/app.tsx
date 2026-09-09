import { createInertiaApp, router } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Nightkeeper';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => (name.startsWith('auth/') ? AuthLayout : AppLayout),
    strictMode: true,
    defaults: {
        visitOptions: (_href, options) => {
            const token = router.page?.props?.csrf_token;

            if (typeof token !== 'string' || token === '') {
                return options;
            }

            return {
                ...options,
                headers: {
                    'X-CSRF-TOKEN': token,
                    ...options.headers,
                },
            };
        },
    },
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
