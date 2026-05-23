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
  Settings2,
  Link,
  Trash2,
  FolderPlus,
  PlusCircle
} from "lucide-react";
import { SlackIcon, DiscordIcon } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { createWorkflowAction } from "@/app/actions/workflows";
import { toast } from "sonner";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";



interface Connector {
  id: string;
  name: string;
  type: string;
  config: string;
  isActive: boolean;
}

interface WorkflowBuilderProps {
  orgId: string;
  orgSlug: string;
  initialConnectors?: Connector[];
}

export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  combinator: 'and' | 'or';
  rules: (FilterRule | FilterGroup)[];
}

const COMMON_FIELDS: Record<string, { value: string; label: string }[]> = {
  "project.created": [
    { value: "payload.name", label: "Project Name" },
    { value: "payload.description", label: "Project Description" },
    { value: "payload.status", label: "Project Status" },
    { value: "payload.userId", label: "Creator ID" },
  ],
  "project.deleted": [
    { value: "payload.name", label: "Project Name" },
    { value: "payload.status", label: "Project Status" },
  ],
  "member.invited": [
    { value: "payload.email", label: "Member Email" },
    { value: "payload.roleId", label: "Role ID" },
  ],
  "member.removed": [
    { value: "payload.userId", label: "Member User ID" },
  ],
  "organization.invitation_accepted": [
    { value: "payload.email", label: "Member Email" },
    { value: "payload.userId", label: "Member User ID" },
  ],
  "role.updated": [
    { value: "payload.userId", label: "User ID" },
    { value: "payload.roleId", label: "New Role ID" },
  ],
};

interface FilterGroupBuilderProps {
  group: FilterGroup;
  onChange: (updatedGroup: FilterGroup) => void;
  depth: number;
  trigger: string;
  t: (key: string, values?: any) => string;
  onDelete?: () => void;
}

function FilterGroupBuilder({ group, onChange, depth, trigger, t, onDelete }: FilterGroupBuilderProps) {
  const triggerFields = COMMON_FIELDS[trigger] || [];

  const handleRuleChange = (index: number, updatedRule: FilterRule) => {
    const newRules = [...group.rules];
    newRules[index] = updatedRule;
    onChange({ ...group, rules: newRules });
  };

  const handleSubGroupChange = (index: number, updatedSubGroup: FilterGroup) => {
    const newRules = [...group.rules];
    newRules[index] = updatedSubGroup;
    onChange({ ...group, rules: newRules });
  };

  const addRule = () => {
    const defaultField = triggerFields[0]?.value || "payload.name";
    onChange({
      ...group,
      rules: [...group.rules, { field: defaultField, operator: "equals", value: "" }],
    });
  };

  const addSubGroup = () => {
    if (depth >= 3) return; // Strict depth limit of 3
    onChange({
      ...group,
      rules: [...group.rules, { combinator: "and", rules: [] }],
    });
  };

  const removeChild = (index: number) => {
    const newRules = group.rules.filter((_, i) => i !== index);
    onChange({ ...group, rules: newRules });
  };

  return (
    <div className={`space-y-4 rounded-xl border p-4 backdrop-blur-sm transition-all ${
      depth === 1 
        ? "bg-secondary/10 border-primary/10" 
        : depth === 2 
        ? "bg-secondary/5 border-orange-500/10 pl-6 border-l-2 border-l-orange-500/30" 
        : "bg-background/40 border-amber-500/10 pl-6 border-l-2 border-l-amber-500/30"
    }`}>
      <div className="flex items-center justify-between gap-4">
        {/* Match combinator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{t("form.combinatorLabel")}:</span>
          <div className="flex items-center gap-1 bg-secondary/30 p-0.5 rounded-md border border-primary/5">
            <button
              type="button"
              onClick={() => onChange({ ...group, combinator: "and" })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                group.combinator === "and"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              AND
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...group, combinator: "or" })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                group.combinator === "or"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              OR
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addRule}
            className="h-7 px-2 text-xs hover:bg-primary/5 text-primary gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {t("form.addRule")}
          </Button>

          {depth < 3 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSubGroup}
              className="h-7 px-2 text-xs hover:bg-orange-500/5 text-orange-500 gap-1"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              {t("form.addGroup")}
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title={t("form.deleteGroup")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {group.rules.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic text-center py-2 bg-secondary/5 rounded-lg border border-dashed border-primary/5">
          No filters configured in this group
        </div>
      ) : (
        <div className="space-y-3">
          {group.rules.map((rule, idx) => {
            const isSubGroup = "combinator" in rule;

            if (isSubGroup) {
              return (
                <FilterGroupBuilder
                  key={idx}
                  group={rule as FilterGroup}
                  onChange={(subGroup) => handleSubGroupChange(idx, subGroup)}
                  depth={depth + 1}
                  trigger={trigger}
                  t={t}
                  onDelete={() => removeChild(idx)}
                />
              );
            }

            const ruleItem = rule as FilterRule;
            const isCustom = !triggerFields.some((f) => f.value === ruleItem.field) && ruleItem.field !== "";

            return (
              <div key={idx} className="flex gap-2 items-center bg-background/25 border border-primary/5 rounded-lg p-2 animate-item">
                {/* Field Selection */}
                <div className="flex-1 min-w-[120px] space-y-1">
                  {!isCustom ? (
                    <Select
                      value={ruleItem.field}
                      onValueChange={(val) => {
                        const fieldValue = val ?? "";
                        if (fieldValue === "custom") {
                          handleRuleChange(idx, { ...ruleItem, field: "" });
                        } else {
                          handleRuleChange(idx, { ...ruleItem, field: fieldValue });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-secondary/20 border-primary/5">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerFields.map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {f.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom" className="text-xs italic text-orange-500 font-medium">
                          Custom path...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <Input
                        value={ruleItem.field}
                        onChange={(e) => handleRuleChange(idx, { ...ruleItem, field: e.target.value })}
                        placeholder="payload.some.path"
                        className="h-8 text-xs bg-secondary/20 border-primary/5"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const defaultField = triggerFields[0]?.value || "payload.name";
                          handleRuleChange(idx, { ...ruleItem, field: defaultField });
                        }}
                        className="h-8 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </Button>
                    </div>
                  )}
                </div>

                {/* Operator Selector */}
                <div className="w-[120px]">
                  <Select
                    value={ruleItem.operator}
                    onValueChange={(val: any) => handleRuleChange(idx, { ...ruleItem, operator: val })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-secondary/20 border-primary/5">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals" className="text-xs">Equals</SelectItem>
                      <SelectItem value="not_equals" className="text-xs">Does not equal</SelectItem>
                      <SelectItem value="contains" className="text-xs">Contains</SelectItem>
                      <SelectItem value="not_contains" className="text-xs">Does not contain</SelectItem>
                      <SelectItem value="exists" className="text-xs">Exists</SelectItem>
                      <SelectItem value="not_exists" className="text-xs">Does not exist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Input */}
                {ruleItem.operator !== "exists" && ruleItem.operator !== "not_exists" ? (
                  <div className="flex-1 min-w-[100px]">
                    <Input
                      value={ruleItem.value}
                      onChange={(e) => handleRuleChange(idx, { ...ruleItem, value: e.target.value })}
                      placeholder="value"
                      className="h-8 text-xs bg-secondary/20 border-primary/5"
                    />
                  </div>
                ) : (
                  <div className="flex-1 text-[10px] text-muted-foreground italic px-2">
                    (No value required)
                  </div>
                )}

                {/* Delete button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChild(idx)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WorkflowBuilder({ orgId, orgSlug, initialConnectors = [] }: WorkflowBuilderProps) {
  const t = useTranslations("Settings.connectivity.automations.builder");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const TRIGGERS = [
    { id: "project.created", label: t("triggers.project_created.label"), description: t("triggers.project_created.description") },
    { id: "project.deleted", label: t("triggers.project_deleted.label"), description: t("triggers.project_deleted.description") },
    { id: "member.invited", label: t("triggers.member_invited.label"), description: t("triggers.member_invited.description") },
    { id: "member.removed", label: t("triggers.member_removed.label"), description: t("triggers.member_removed.description") },
    { id: "organization.invitation_accepted", label: t("triggers.organization_invitation_accepted.label"), description: t("triggers.organization_invitation_accepted.description") },
    { id: "role.updated", label: t("triggers.role_updated.label"), description: t("triggers.role_updated.description") },
  ];

  const ACTIONS = [
    { id: "webhook", label: t("actions.webhook.label"), description: t("actions.webhook.description"), icon: Globe },
  ];

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
  const [connectorId, setConnectorId] = useState<string>("custom");
  const [filters, setFilters] = useState<FilterGroup>({
    combinator: "and",
    rules: [],
  });

  const reset = () => {
    setStep(1);
    setName("");
    setTrigger("");
    setTargetUrl("");
    setConnectorId("custom");
    setFilters({
      combinator: "and",
      rules: [],
    });
  };

  const handleSave = async () => {
    if (connectorId === "custom" && !targetUrl) {
      toast.error(t("form.endpointPlaceholder")); // Or a more specific error key if we add one
      return;
    }

    if (connectorId !== "custom" && !connectorId) {
      toast.error(t("form.destinationPlaceholder"));
      return;
    }

    setLoading(true);
    try {
      const result = await createWorkflowAction({
        name: name || `Automation: ${trigger}`,
        trigger,
        targetUrl: connectorId === "custom" ? targetUrl : undefined,
        connectorId: connectorId === "custom" ? undefined : connectorId,
        filters: filters.rules.length > 0 ? filters : undefined,
        orgId,
        orgSlug,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("toast.success") || "Workflow created successfully!");
        setOpen(false);
        reset();
      }
    } catch {
      toast.error(t("toast.error") || "Failed to create workflow");
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
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          {t("buttons.create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-hidden min-h-[450px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("step", { 
              step, 
              description: 
                step === 1 ? t("steps.trigger") : 
                step === 2 ? t("steps.action") : 
                step === 3 ? t("steps.conditions") : 
                t("steps.config") 
            })}
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
                  <Label>{t("form.nameLabel")}</Label>
                  <Input 
                    placeholder={t("form.namePlaceholder")} 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary/30 border-primary/10"
                  />
                </div>
                <div className="space-y-3">
                  <Label>{t("form.triggerLabel")}</Label>
                  <div className="grid gap-2">
                    {TRIGGERS.map((triggerOption) => (
                      <button
                        key={triggerOption.id}
                        onClick={() => setTrigger(triggerOption.id)}
                        className={`text-left p-3 rounded-lg border transition-all animate-item ${
                          trigger === triggerOption.id 
                            ? "bg-primary/10 border-primary" 
                            : "bg-secondary/20 border-primary/5 hover:border-primary/20"
                        }`}
                      >
                        <div className="font-medium text-sm">{triggerOption.label}</div>
                        <div className="text-xs text-muted-foreground">{triggerOption.description}</div>
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
                  <Label>{t("form.actionLabel")}</Label>
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
                className="space-y-4 step-content"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">{t("form.conditionsTitle")}</h4>
                  <p className="text-xs text-muted-foreground">{t("form.conditionsDesc")}</p>
                </div>

                <div className="overflow-y-auto max-h-[280px] pr-1">
                  <FilterGroupBuilder
                    group={filters}
                    onChange={setFilters}
                    depth={1}
                    trigger={trigger}
                    t={t}
                  />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 step-content"
              >
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
                  <Settings2 className="w-5 h-5 text-orange-500" />
                  <div className="text-xs text-muted-foreground italic">
                    {t("form.configLabel", { 
                      type: "Webhook", 
                      trigger: (TRIGGERS.find(t => t.id === trigger)?.label ?? "") as string
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("form.destinationLabel")}</Label>
                    <Select value={connectorId} onValueChange={(val) => val && setConnectorId(val)}>
                      <SelectTrigger className="bg-secondary/30 border-primary/10">
                        <SelectValue placeholder={t("form.destinationPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            <span>Custom Webhook (JSON)</span>
                          </div>
                        </SelectItem>
                        {initialConnectors.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              {c.type === "slack" ? <SlackIcon className="w-4 h-4 text-emerald-500" /> : <DiscordIcon className="w-4 h-4 text-indigo-500" />}
                              <span>{c.name} ({c.type})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {connectorId === "custom" ? (
                    <div className="space-y-2 animate-item">
                      <Label htmlFor="targetUrl">{t("form.endpointLabel")}</Label>
                      <Input
                        id="targetUrl"
                        placeholder={t("form.endpointPlaceholder")}
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="bg-secondary/30 border-primary/10"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {t("form.endpointDesc")}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2 animate-item">
                      <p className="text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {t("form.managedIntegration")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("form.managedIntegrationDesc")}
                      </p>
                    </div>
                  )}
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
            {step === 1 ? t("buttons.cancel") : <><ChevronLeft className="w-4 h-4" /> {t("buttons.back")}</>}
          </Button>
          
          {step < 4 ? (
            <Button 
              onClick={nextStep} 
              disabled={step === 1 && !trigger}
              className="gap-2"
            >
              {t("buttons.continue")} <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading} className="gap-2 min-w-[120px]">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>{t("buttons.finish")} <Zap className="w-4 h-4" /></>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
