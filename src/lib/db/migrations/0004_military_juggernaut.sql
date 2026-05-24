CREATE TABLE "billing_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"metric" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_usage_organizationId_metric_unique" UNIQUE("organizationId","metric")
);
--> statement-breakpoint
ALTER TABLE "workflow" ADD COLUMN "filters" text;--> statement-breakpoint
ALTER TABLE "billing_usage" ADD CONSTRAINT "billing_usage_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;