/**
 * Static permissions that can be assigned to roles.
 * Key format: [resource]:[action]
 */
export const PERMISSIONS = {
  // Organization Management
  "org:update": {
    key: "org:update",
    name: "Update Organization",
    description: "Ability to update organization settings and details",
  },
  "org:delete": {
    key: "org:delete",
    name: "Delete Organization",
    description: "Ability to delete the entire organization and its data",
  },

  // Member Management
  "members:read": {
    key: "members:read",
    name: "Read Members",
    description: "Ability to view organization members and their roles",
  },
  "members:invite": {
    key: "members:invite",
    name: "Invite Members",
    description: "Ability to send invitations to new members",
  },
  "members:remove": {
    key: "members:remove",
    name: "Remove Members",
    description: "Ability to remove members from the organization",
  },

  // RBAC Management
  "roles:manage": {
    key: "roles:manage",
    name: "Manage Roles",
    description: "Ability to create, update, and delete custom roles",
  },
  "roles:assign": {
    key: "roles:assign",
    name: "Assign Roles",
    description: "Ability to change roles of other members",
  },

  // Billing (Future-proofing)
  "billing:read": {
    key: "billing:read",
    name: "View Billing",
    description: "Ability to view subscription and invoices",
  },
  "billing:manage": {
    key: "billing:manage",
    name: "Manage Subscription",
    description: "Ability to change plans and update payment methods",
  },

  // Audit Logs
  "audit_logs:read": {
    key: "audit_logs:read",
    name: "View Activity Log",
    description: "Ability to view the organization's administrative activity log",
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[PermissionKey];

/**
 * Helper to get all available permission keys
 */
export const ALL_PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

/**
 * Default sets of permissions for standard roles
 */
export const DEFAULT_ADMIN_PERMISSIONS: PermissionKey[] = ALL_PERMISSION_KEYS;

export const DEFAULT_MEMBER_PERMISSIONS: PermissionKey[] = [
  "members:read",
  "members:invite",
  "billing:read",
];

export const DEFAULT_VIEWER_PERMISSIONS: PermissionKey[] = [
  "members:read",
  "billing:read",
];
