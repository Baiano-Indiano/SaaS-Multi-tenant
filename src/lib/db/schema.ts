import { pgTable, text, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const sessions = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => users.id)
});

export const accounts = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => users.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const verifications = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt")
});

export const organizations = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logo: text("logo"),
	createdAt: timestamp("createdAt").notNull(),
	metadata: text("metadata"),
	tenantSchemaName: text("tenantSchemaName").notNull().default(""),
	plan: text("plan").notNull().default("free"),
	stripeCustomerId: text("stripeCustomerId"),
	stripeSubscriptionId: text("stripeSubscriptionId"),
	customDomain: text("customDomain").unique(),
	domainVerified: boolean("domainVerified").notNull().default(false),
	verificationToken: text("verificationToken")
});

export const members = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organizations.id),
	userId: text("userId").notNull().references(() => users.id),
	role: text("role").notNull(),
	roleId: text("roleId"), // Reference to role in tenant schema (logical)
	createdAt: timestamp("createdAt").notNull()
});

export const membersRelations = relations(members, ({ one }) => ({
	organization: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [members.userId],
		references: [users.id],
	}),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	members: many(members),
}));

/**
 * RBAC Tables (These will be dynamically created in tenant schemas)
 */
export const roles = pgTable("role", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	description: text("description"),
	createdAt: timestamp("createdAt").notNull().defaultNow()
});

export const rolePermissions = pgTable("role_permission", {
	roleId: text("roleId").notNull().references(() => roles.id, { onDelete: 'cascade' }),
	permissionKey: text("permissionKey").notNull(),
}, (t) => ({
	pk: primaryKey({ columns: [t.roleId, t.permissionKey] }),
}));

/**
 * Business Tables (Tenant-Side)
 * Strictly decoupled from 'public' (Rule 3)
 */
export const projects = pgTable("project", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	status: text("status").notNull().default("active"),
	userId: text("userId").notNull(), // Logical reference to public.user id (Rule 3)
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const invitations = pgTable("invitation", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organizations.id),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	inviterId: text("inviterId").notNull().references(() => users.id),
	roleId: text("roleId"), // Custom dynamic role ID
	metadata: text("metadata"), // For extra flexibility
});

export const invitationsRelations = relations(invitations, ({ one }) => ({
	organization: one(organizations, {
		fields: [invitations.organizationId],
		references: [organizations.id],
	}),
	inviter: one(users, {
		fields: [invitations.inviterId],
		references: [users.id],
	}),
}));

export const notifications = pgTable("notification", {
	id: text("id").primaryKey(),
	userId: text("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
	organizationId: text("organizationId").references(() => organizations.id, { onDelete: 'cascade' }),
	type: text("type").notNull(), // e.g., 'SYSTEM', 'BILLING', 'PROJECT_CREATED', 'MEMBER_JOINED'
	title: text("title").notNull(),
	message: text("message").notNull(),
	link: text("link"),
	readAt: timestamp("readAt"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [notifications.organizationId],
		references: [organizations.id],
	}),
}));

export const auditLogs = pgTable("audit_log", {
	id: text("id").primaryKey(),
	userId: text("userId").notNull(), // Logical reference to public.user id
	userName: text("userName").notNull(),
	userEmail: text("userEmail").notNull(),
	action: text("action").notNull(), // e.g., 'PROJECT_CREATED', 'MEMBER_INVITED'
	entityType: text("entityType").notNull(), // e.g., 'PROJECT', 'MEMBER'
	entityId: text("entityId"),
	details: text("details"), // JSON string or summary
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});
