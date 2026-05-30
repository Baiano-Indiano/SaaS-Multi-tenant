import { z } from "zod";

// ─── Primitive Validators ────────────────────────────────────────────────────

export const uuidSchema = z.string().min(1).max(64, "Invalid ID format");

export const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(64, "Slug must be at most 64 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");

export const orgNameSchema = z
  .string()
  .min(2, "Organization name must be at least 2 characters")
  .max(128, "Organization name must be at most 128 characters")
  .trim();

export const emailSchema = z.string().email("Invalid email address").max(255);

export const urlSchema = z.string().url("Invalid URL").max(2048);

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(128, "Name must be at most 128 characters")
  .trim();

export const descriptionSchema = z
  .string()
  .max(1024, "Description must be at most 1024 characters")
  .trim()
  .optional();

// ─── Organization Actions ────────────────────────────────────────────────────

export const createOrgSchema = z.object({
  name: orgNameSchema,
  slug: slugSchema,
});

export const updateOrgSchema = z.object({
  orgId: uuidSchema,
  name: orgNameSchema,
  slug: slugSchema,
});

// ─── Member Actions ──────────────────────────────────────────────────────────

export const updateMemberRoleSchema = z.object({
  memberId: uuidSchema,
  roleId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const removeMemberSchema = z.object({
  memberId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  roleId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});



// ─── Project Actions ─────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const deleteProjectSchema = z.object({
  projectId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const updateProjectSchema = z.object({
  orgId: uuidSchema,
  projectId: uuidSchema,
  orgSlug: slugSchema,
  data: z.object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    status: z.enum(["active", "archived", "paused"]).optional(),
  }),
});

// ─── Webhook Actions ─────────────────────────────────────────────────────────

export const createWebhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string().min(1)).min(1, "At least one event is required"),
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const deleteWebhookSchema = z.object({
  webhookId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

// ─── Connector Actions ───────────────────────────────────────────────────────

export const createConnectorSchema = z.object({
  name: nameSchema,
  type: z.enum(["slack", "discord", "webhook", "teams"]),
  webhookUrl: urlSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const deleteConnectorSchema = z.object({
  connectorId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const testConnectorSchema = z.object({
  connectorId: uuidSchema,
  orgId: uuidSchema,
});

export const toggleConnectorEventSchema = z.object({
  connectorId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
  event: z.string().min(1),
  isActive: z.boolean(),
});

// ─── Workflow Actions ────────────────────────────────────────────────────────

export const filterRuleOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "exists",
  "not_exists",
]);

export const filterRuleSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: filterRuleOperatorSchema,
  value: z.string().default(""),
});

// Enforce max 3 levels of nesting at schema validation layer
const filterGroupLevel3Schema = z.object({
  combinator: z.enum(["and", "or"]),
  rules: z.array(filterRuleSchema),
});

const filterGroupLevel2Schema = z.object({
  combinator: z.enum(["and", "or"]),
  rules: z.array(z.union([filterRuleSchema, filterGroupLevel3Schema])),
});

export const filterGroupSchema = z.object({
  combinator: z.enum(["and", "or"]),
  rules: z.array(z.union([filterRuleSchema, filterGroupLevel2Schema])),
});

export const createWorkflowSchema = z.object({
  name: nameSchema,
  trigger: z.string().min(1),
  targetUrl: urlSchema.optional(),
  connectorId: uuidSchema.optional(),
  filters: filterGroupSchema.optional().nullable(),
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const deleteWorkflowSchema = z.object({
  workflowId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const retryWorkflowDeliverySchema = z.object({
  deliveryId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

// ─── RBAC Actions ────────────────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().max(512).trim(),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const updateRoleSchema = z.object({
  id: uuidSchema,
  name: nameSchema,
  description: z.string().max(512).trim(),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const deleteRoleSchema = z.object({
  roleId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const syncRolePermissionsSchema = z.object({
  orgId: uuidSchema,
});

// ─── Security Schemas ──────────────────────────────────────────────────────

export const toggle2FAEnforcementSchema = z.object({
  organizationId: uuidSchema,
  enabled: z.boolean(),
});

export const check2FAComplianceSchema = z.object({
  userId: z.string().min(1),
  organizationId: uuidSchema,
});



// ─── Domain Actions ──────────────────────────────────────────────────────────

export const addDomainSchema = z.object({
  orgId: uuidSchema,
  domainRaw: z.string().min(3).max(253),
});

export const verifyDomainSchema = z.object({
  orgId: uuidSchema,
  domainId: uuidSchema,
});

export const deleteDomainSchema = z.object({
  orgId: uuidSchema,
  domainId: uuidSchema,
});

export const addCustomDomainSchema = z.object({
  orgId: uuidSchema,
  domain: z
    .string()
    .min(3)
    .max(253)
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/, "Invalid domain format"),
});

export const removeCustomDomainSchema = z.object({
  orgId: uuidSchema,
});

export const checkDomainStatusSchema = z.object({
  orgId: uuidSchema,
});

// ─── SSO Actions ─────────────────────────────────────────────────────────────

export const updateSSOConfigSchema = z.object({
  orgId: uuidSchema,
  data: z.object({
    providerId: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().optional(),
    issuer: z.string().url().optional(),
    isActive: z.boolean(),
  }),
});

// u{2500}u{2500}u{2500} API Key Actions u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}u{2500}

export const createApiKeySchema = z.object({
  name: nameSchema,
  roleId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
  expiresInDays: z.number().int().min(0).max(3650).optional(),
});

export const deleteApiKeySchema = z.object({
  keyId: uuidSchema,
  orgId: uuidSchema,
  orgSlug: slugSchema,
});

export const updateDataRetentionSchema = z.object({
  organizationId: uuidSchema,
  enabled: z.boolean(),
  days: z.number().int().nullable().optional(),
}).refine(
  (data) => {
    if (data.enabled) {
      return typeof data.days === "number" && data.days >= 7;
    }
    return true;
  },
  {
    message: "Retention period must be at least 7 days when enabled",
    path: ["days"],
  }
);

