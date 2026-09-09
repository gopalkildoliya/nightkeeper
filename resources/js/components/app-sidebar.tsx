import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bug,
    Database,
    LayoutGrid,
    ListTodo,
    Settings,
    Terminal,
    Workflow,
} from 'lucide-react';
import AppearanceToggleTab from '@/components/appearance-tabs';
import AppLogo from '@/components/app-logo';
import { EnvironmentSwitcher } from '@/components/environment-switcher';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { environmentPath, withRange } from '@/lib/range';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { range, openIssueCount, currentEnvironment } = usePage().props;
    const rangeValue = range.value;
    const environmentId = currentEnvironment?.id;

    const mainNavItems: NavItem[] = environmentId
        ? [
              {
                  title: 'Overview',
                  href: withRange(
                      environmentPath(environmentId, '/dashboard'),
                      rangeValue,
                  ),
                  icon: LayoutGrid,
              },
              {
                  title: 'Issues',
                  href: withRange(
                      environmentPath(environmentId, '/issues'),
                      rangeValue,
                  ),
                  icon: AlertTriangle,
                  badge: openIssueCount,
              },
              {
                  title: 'Requests',
                  href: withRange(
                      environmentPath(environmentId, '/requests'),
                      rangeValue,
                  ),
                  icon: Workflow,
              },
              {
                  title: 'Exceptions',
                  href: withRange(
                      environmentPath(environmentId, '/exceptions'),
                      rangeValue,
                  ),
                  icon: Bug,
              },
              {
                  title: 'Queries',
                  href: withRange(
                      environmentPath(environmentId, '/queries'),
                      rangeValue,
                  ),
                  icon: Database,
              },
              {
                  title: 'Commands',
                  href: withRange(
                      environmentPath(environmentId, '/commands'),
                      rangeValue,
                  ),
                  icon: Terminal,
              },
              {
                  title: 'Jobs',
                  href: withRange(
                      environmentPath(environmentId, '/jobs'),
                      rangeValue,
                  ),
                  icon: ListTodo,
              },
              {
                  title: 'Environment',
                  href: environmentPath(environmentId, '/settings'),
                  icon: Settings,
              },
          ]
        : [
              {
                  title: 'Organisations',
                  href: '/organizations',
                  icon: Settings,
              },
          ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={
                                    environmentId
                                        ? withRange(
                                              environmentPath(
                                                  environmentId,
                                                  '/dashboard',
                                              ),
                                              rangeValue,
                                          )
                                        : '/organizations'
                                }
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <EnvironmentSwitcher />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <div className="group-data-[collapsible=icon]:hidden px-2 pb-2">
                    <AppearanceToggleTab className="w-full justify-center" />
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
