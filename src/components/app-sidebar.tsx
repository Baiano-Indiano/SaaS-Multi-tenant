import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Users, Settings, CreditCard } from 'lucide-react';
import { OrgSwitcher } from '@/components/org-switcher';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo?: string | null;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations: Organization[];
  activeOrgId: string | null;
}

const items = [
  { title: 'Overview', url: '#', icon: LayoutDashboard },
  { title: 'Members', url: '#', icon: Users },
  { title: 'Billing', url: '#', icon: CreditCard },
  { title: 'Settings', url: '#', icon: Settings },
];

export function AppSidebar({
  organizations,
  activeOrgId,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
