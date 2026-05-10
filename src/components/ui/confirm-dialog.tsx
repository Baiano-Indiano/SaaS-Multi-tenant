"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ButtonProps } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ButtonProps["variant"];
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = React.useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleClose = () => {
    setOptions(null);
    setResolver(null);
  };

  const handleConfirm = () => {
    resolver?.(true);
    handleClose();
  };

  const handleCancel = () => {
    resolver?.(false);
    handleClose();
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog 
        open={!!options} 
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            <AlertDialogDescription>{options?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options?.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={options?.variant || "default"}
              onClick={handleConfirm}
            >
              {options?.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
