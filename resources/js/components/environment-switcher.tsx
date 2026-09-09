import { Link, usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
                                    {currentEnvironment?.name ?? 'Environments'}
                                </span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {currentOrganization?.name}
                                    {currentApplication
                                        ? ` · ${currentApplication.name}`
                                        : ''}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
                        align="start"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'right'
                        }
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Environments
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {switcher.map((item) => (
                            <DropdownMenuItem key={item.id} asChild>
                                <Link
                                    href={withRange(
                                        environmentPath(item.id, '/dashboard'),
                                        range.value,
                                    )}
                                    prefetch
                                >
                                    <div className="grid">
                                        <span className="font-medium">
                                            {item.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {item.organization} / {item.application}
                                        </span>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
