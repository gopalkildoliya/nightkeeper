import { Link, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { environmentPath, withRange } from '@/lib/range';
import type { SwitcherEnvironment } from '@/types/global';

function environmentHref(id: string, range: string): string {
    return withRange(environmentPath(id, '/dashboard'), range);
}

function EnvironmentItem({
    environment,
    range,
    isCurrent,
}: {
    environment: SwitcherEnvironment;
    range: string;
    isCurrent: boolean;
}) {
    return (
        <DropdownMenuItem asChild>
            <Link href={environmentHref(environment.id, range)} prefetch>
                <span className="truncate">{environment.name}</span>
                {isCurrent ? <Check className="ml-auto size-4" /> : null}
            </Link>
        </DropdownMenuItem>
    );
}

export function EnvironmentSwitcher() {
    const { currentEnvironment, currentApplication, currentOrganization, switcher, range } =
        usePage().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    if (switcher.length === 0) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {currentApplication?.name ?? 'Applications'}
                                </span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {currentOrganization?.name}
                                    {currentEnvironment
                                        ? ` · ${currentEnvironment.name}`
                                        : ''}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-64 overflow-visible rounded-lg"
                        align="start"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'right'
                        }
                    >
                        {switcher.map((organization, index) => (
                            <DropdownMenuGroup key={organization.id}>
                                {index > 0 ? <DropdownMenuSeparator /> : null}
                                <DropdownMenuLabel className="text-muted-foreground text-xs">
                                    {organization.name}
                                </DropdownMenuLabel>
                                {organization.applications.map((application) => {
                                    const isCurrentApp =
                                        currentApplication?.id === application.id;

                                    if (application.environments.length === 1) {
                                        const environment =
                                            application.environments[0];

                                        return (
                                            <DropdownMenuItem
                                                key={application.id}
                                                asChild
                                            >
                                                <Link
                                                    href={environmentHref(
                                                        environment.id,
                                                        range.value,
                                                    )}
                                                    prefetch
                                                >
                                                    <span className="truncate">
                                                        {application.name}
                                                    </span>
                                                    {isCurrentApp ? (
                                                        <Check className="ml-auto size-4" />
                                                    ) : null}
                                                </Link>
                                            </DropdownMenuItem>
                                        );
                                    }

                                    return (
                                        <DropdownMenuSub key={application.id}>
                                            <DropdownMenuSubTrigger className="gap-2">
                                                <span className="truncate">
                                                    {application.name}
                                                </span>
                                                {isCurrentApp ? (
                                                    <Check className="size-4" />
                                                ) : null}
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent className="min-w-40">
                                                    {application.environments.map(
                                                        (environment) => (
                                                            <EnvironmentItem
                                                                key={
                                                                    environment.id
                                                                }
                                                                environment={
                                                                    environment
                                                                }
                                                                range={
                                                                    range.value
                                                                }
                                                                isCurrent={
                                                                    currentEnvironment?.id ===
                                                                    environment.id
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                    );
                                })}
                            </DropdownMenuGroup>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
