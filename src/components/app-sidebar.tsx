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
import { LayoutDashboard, Users, Settings, CreditCard, FolderKanban } from 'lucide-react';
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

export function AppSidebar({ organizations, activeOrgId, ...props }: AppSidebarProps) {
  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const activeSlug = activeOrg?.slug || "";

  const menuItems = [
    { title: "Overview", url: `/org/${activeSlug}/dashboard`, icon: LayoutDashboard },
    { title: "Projects", url: `/org/${activeSlug}/projects`, icon: FolderKanban },
    { title: "Members", url: `/org/${activeSlug}/settings/members`, icon: Users },
    { title: "Billing", url: `/org/${activeSlug}/settings/billing`, icon: CreditCard },
    { title: "Settings", url: `/org/${activeSlug}/settings/roles`, icon: Settings },
  ];

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 mb-2">
            Organization
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<a href={item.url} />}
                    className="hover:bg-zinc-900 transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
