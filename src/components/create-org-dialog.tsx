'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createOrganizationAction } from '@/lib/actions/organization';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const t = useTranslations('Organization');
  const tCommon = useTranslations('Common');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setIsPending(true);
    const promise = createOrganizationAction({}, formData).then((res) => {
      if (res?.error) throw new Error(res.error);
      return res;
    });

    toast.promise(promise, {
      loading: t('creating'),
      success: t('createdSuccess'),
      error: (err) => err.message,
    });

    try {
      await promise;
      onOpenChange(false);
    } catch {
      // Error is handled by toast
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('createTitle')}</DialogTitle>
          <DialogDescription>
            {t('createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">{t('orgNameLabel')}</Label>
              <Input
                id="org-name"
                name="name"
                placeholder={t('orgNamePlaceholder')}
                required
                minLength={2}
                maxLength={64}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {t('createOrganization')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

