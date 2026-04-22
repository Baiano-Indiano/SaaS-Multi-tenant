'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronsUpDown, Check, Plus, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateOrgDialog } from '@/components/create-org-dialog';

gsap.registerPlugin(useGSAP);

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
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const reduceMotionRef = React.useRef(false);
  const onTriggerEnterRef = React.useRef(() => {});
  const onTriggerLeaveRef = React.useRef(() => {});

  const activeOrg =
    organizations.find((o) => o.id === activeOrgId) ?? organizations[0];

  const handleSwitch = (org: Organization) => {
    router.push(`/org/${org.slug}/dashboard`);
  };

  useGSAP((_, contextSafe) => {
    if (!triggerRef.current) return;
    const safe = contextSafe ?? ((fn: () => void) => fn);

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: reduce)', () => {
      reduceMotionRef.current = true;
    });

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      reduceMotionRef.current = false;

      gsap.from(triggerRef.current, {
        autoAlpha: 0,
        y: -8,
        duration: 0.45,
        ease: 'power2.out',
      });
    });

    onTriggerEnterRef.current = safe(() => {
      if (reduceMotionRef.current || !triggerRef.current) return;

      const chevron = triggerRef.current.querySelector('.org-switcher-chevron');

      gsap.to(triggerRef.current, {
        x: 2,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      if (chevron) {
        gsap.to(chevron, {
          rotation: 90,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    });

    onTriggerLeaveRef.current = safe(() => {
      if (reduceMotionRef.current || !triggerRef.current) return;

      const chevron = triggerRef.current.querySelector('.org-switcher-chevron');

      gsap.to(triggerRef.current, {
        x: 0,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      if (chevron) {
        gsap.to(chevron, {
          rotation: 0,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    });

    return () => {
      mm.revert();
      onTriggerEnterRef.current = () => {};
      onTriggerLeaveRef.current = () => {};
    };
  }, { scope: triggerRef });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={triggerRef}
          className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm h-12 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors outline-none"
          onMouseEnter={() => onTriggerEnterRef.current()}
          onMouseLeave={() => onTriggerLeaveRef.current()}
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
          <ChevronsUpDown className="org-switcher-chevron ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56 rounded-lg"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <DropdownMenuGroup>
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
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
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
