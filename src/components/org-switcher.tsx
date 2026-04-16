'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, Check, Plus, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateOrgDialog } from '@/components/create-org-dialog';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo?: string | null;
}

interface OrgSwitcherProps {
  organizations: Organization[];
  activeOrgId: string | null;
}

export function OrgSwitcher({ organizations, activeOrgId }: OrgSwitcherProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const activeOrg =
    organizations.find((o) => o.id === activeOrgId) ?? organizations[0];

  const handleSwitch = (org: Organization) => {
    router.push(`/org/${org.slug}/dashboard`);
  };

  return (
    <>
      <DropdownMenu>
        {/* base-ui Trigger renders a <button> by default — no asChild needed */}
        <DropdownMenuTrigger
          className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm h-12 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors outline-none"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {activeOrg?.name ?? 'Select Organization'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {organizations.length} organization
              {organizations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56 rounded-lg"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Organizations
          </DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org)}
              className="cursor-pointer"
            >
              <Building2 className="mr-2 size-4" />
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === activeOrg?.id && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {/* D-02: Fixed "Create" button at the bottom — Vercel/Notion/Slack pattern */}
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Plus className="mr-2 size-4" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrgDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
