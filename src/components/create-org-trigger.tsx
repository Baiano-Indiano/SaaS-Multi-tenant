'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateOrgDialog } from '@/components/create-org-dialog';

export function CreateOrgTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="w-full" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Create Organization
      </Button>
      <CreateOrgDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
