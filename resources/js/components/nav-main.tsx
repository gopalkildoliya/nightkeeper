import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { hrefPath } from '@/lib/range';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Nightkeeper</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const path = hrefPath(item.href);
                    const isDashboard = path.endsWith('/dashboard');
                    const active = isDashboard
                        ? isCurrentUrl(path)
                        : isCurrentOrParentUrl(path);

                    return (
                        <Fragment key={item.title}>
                            {item.hasSeparator && (
                                <SidebarSeparator className="my-1.5" />
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        {item.badge ? (
                                            <Badge
                                                variant="destructive"
                                                className="ml-auto h-5 min-w-5 px-1.5"
                                            >
                                                {item.badge}
                                            </Badge>
                                        ) : null}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </Fragment>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
