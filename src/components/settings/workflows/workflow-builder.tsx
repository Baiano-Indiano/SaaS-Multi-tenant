"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  Globe, 
  CheckCircle2,
  Loader2,
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createWorkflowAction } from "@/app/actions/workflows";
import { toast } from "sonner";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";

const TRIGGERS = [
  { id: "project.created", label: "Project Created", description: "Triggered when a new project is created in this org." },
  { id: "member.invited", label: "Member Invited", description: "Triggered when a new member is invited." },
  { id: "organization.invitation_accepted", label: "Invitation Accepted", description: "Triggered when a member joins the org." },
];

const ACTIONS = [
  { id: "webhook", label: "Send Webhook", description: "Deliver a POST request with the event payload to a URL.", icon: Globe },
];

interface WorkflowBuilderProps {
  orgId: string;
  orgSlug: string;
}

export function WorkflowBuilder({ orgId, orgSlug }: WorkflowBuilderProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (open) {
      // Premium entrance for the active step content
      gsap.fromTo(".step-content", 
        { opacity: 0, y: 10, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out", stagger: 0.1 }
      );
      
      // Staggered entrance for buttons/cards
      gsap.fromTo(".animate-item",
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)", stagger: 0.08, delay: 0.1 }
      );
    }
  }, { dependencies: [open, step], scope: containerRef });
  
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const reset = () => {
    setStep(1);
    setName("");
    setTrigger("");
    setTargetUrl("");
  };

  const handleSave = async () => {
    if (!targetUrl) {
      toast.error("Please enter a destination URL");
      return;
    }

    setLoading(true);
    try {
      const result = await createWorkflowAction({
        name: name || `Automation: ${trigger}`,
        trigger,
        targetUrl,
        orgId,
        orgSlug,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Workflow created successfully!");
        setOpen(false);
        reset();
      }
    } catch {
      toast.error("Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) reset();
    }}>
      <DialogTrigger
        render={
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Create Automation
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px] overflow-hidden min-h-[450px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Automation Builder
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? "Select Trigger" : step === 2 ? "Select Action" : "Configure Connection"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 relative" ref={containerRef}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 step-content"
              >
                <div className="space-y-2">
                  <Label>Workflow Name</Label>
                  <Input 
                    placeholder="E.g., Notify Slack on Project Create" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary/30 border-primary/10"
                  />
                </div>
                <div className="space-y-3">
                  <Label>When this happens...</Label>
                  <div className="grid gap-2">
                    {TRIGGERS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTrigger(t.id)}
                        className={`text-left p-3 rounded-lg border transition-all animate-item ${
                          trigger === t.id 
                            ? "bg-primary/10 border-primary" 
                            : "bg-secondary/20 border-primary/5 hover:border-primary/20"
                        }`}
                      >
                        <div className="font-medium text-sm">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 step-content"
              >
                <div className="space-y-3">
                  <Label>Then do this...</Label>
                  <div className="grid gap-2">
                    {ACTIONS.map((a) => (
                      <button
                        key={a.id}
                        className="text-left p-4 rounded-lg border bg-primary/10 border-primary flex items-center justify-between animate-item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <a.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{a.label}</div>
                            <div className="text-xs text-muted-foreground">{a.description}</div>
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 step-content"
              >
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
                  <Settings2 className="w-5 h-5 text-orange-500" />
                  <div className="text-xs text-muted-foreground italic">
                    Configuring <strong>Webhook</strong> for <strong>{trigger}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Endpoint URL (POST)</Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://hooks.slack.com/services/..."
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="bg-secondary/30 border-primary/10"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {"We'll"} send the event data as a JSON payload to this address.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-primary/5">
          <Button
            variant="ghost"
            onClick={step === 1 ? () => setOpen(false) : prevStep}
            className="gap-2"
          >
            {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4" /> Back</>}
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={nextStep} 
              disabled={step === 1 && !trigger}
              className="gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading} className="gap-2 min-w-[120px]">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Finish & Activate <Zap className="w-4 h-4" /></>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
