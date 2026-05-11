CREATE TABLE "audit_export_config" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"bucketName" text NOT NULL,
	"region" text,
	"endpoint" text,
	"accessKeyId" text,
	"secretAccessKey" text,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"exportStatus" text DEFAULT 'idle' NOT NULL,
	"lastError" text,
	"lastExportAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sso_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"oidcConfig" text,
	"samlConfig" text,
	"userId" text NOT NULL,
	"providerId" text NOT NULL,
	"organizationId" text,
	"domain" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_component" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'operational' NOT NULL,
	"order" text DEFAULT '0' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_incident" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"severity" text DEFAULT 'minor' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "status" text DEFAULT 'processing' NOT NULL;--> statement-breakpoint
ALTER TABLE "sso_provider" ADD CONSTRAINT "sso_provider_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_provider" ADD CONSTRAINT "sso_provider_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_component" ADD CONSTRAINT "status_component_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_incident" ADD CONSTRAINT "status_incident_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "twoFactorSecret";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "twoFactorBackupCodes";--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_userId_unique" UNIQUE("organizationId","userId");