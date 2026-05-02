CREATE TABLE "connector" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_domain" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"domain" text NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"verificationToken" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_domain_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "sso_config" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"providerId" text NOT NULL,
	"clientId" text NOT NULL,
	"clientSecret" text,
	"issuer" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow" ADD COLUMN "connectorId" text;--> statement-breakpoint
ALTER TABLE "organization_domain" ADD CONSTRAINT "organization_domain_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_config" ADD CONSTRAINT "sso_config_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;