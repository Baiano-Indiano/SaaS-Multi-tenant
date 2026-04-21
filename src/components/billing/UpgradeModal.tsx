"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";

interface UpgradeModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    reason: string;
    requiredPlan?: string;
}

export function UpgradeModal({ isOpen, setIsOpen, title, reason }: UpgradeModalProps) {
    const router = useRouter();
    const params = useParams();
    
    // We assume this is used inside an organization scope
    const orgSlug = params?.orgSlug as string;

    const handleUpgradeClick = () => {
        setIsOpen(false);
        if (orgSlug) {
            router.push(`/org/${orgSlug}/billing`);
        } else {
            console.error("Missing orgSlug to redirect to billing");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="pt-2">
                        {reason}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex flex-row gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Maybe Later
                    </Button>
                    <Button onClick={handleUpgradeClick}>
                        View Plans
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
