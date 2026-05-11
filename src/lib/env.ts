import { z } from "zod";

/**
 * Environment Variable Validation
 *
 * Validates ALL critical environment variables at boot time.
 * If a required variable is missing or malformed, the app crashes early
 * with a clear error message instead of failing unpredictably at runtime.
 */

const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Postgres connection string"),
  READ_DATABASE_URL: z.string().url().optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).optional().default(10),
  DB_IDLE_TIMEOUT: z.coerce.number().int().min(1).optional().default(20),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.string().url().optional(),

  // Encryption (64-char hex = 32 bytes)
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)")
    .regex(/^[0-9a-fA-F]+$/, "ENCRYPTION_KEY must be a valid hex string"),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

  // Email (optional in dev)
  RESEND_API_KEY: z.string().optional(),

  // Events / Webhooks
  QSTASH_TOKEN: z.string().optional(),
  INTERNAL_WEBHOOK_SECRET: z.string().min(16).optional(),

  // Vercel (optional)
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),

  // Public
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),

  // Runtime
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

/**
 * In development, allow missing optional secrets with loud warnings.
 * In production, enforce everything strictly.
 */
function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  // During Next.js build phase, skip validation entirely
  if (isBuildPhase) {
    return process.env as unknown as z.infer<typeof serverSchema>;
  }

  // In development, make critical secrets optional to allow local dev without full config
  const devSchema = serverSchema.extend({
    DATABASE_URL: z.string().optional().default("postgres://postgres:postgres@localhost:5432/saas_db"),
    BETTER_AUTH_SECRET: z.string().optional().default("dev-secret-change-me-in-prod"),
    ENCRYPTION_KEY: z.string().optional().default("0".repeat(64)),
    UPSTASH_REDIS_REST_URL: z.string().optional().default("http://localhost:6379"),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional().default("dev-token"),
  });

  const schema = isProd ? serverSchema : devSchema;
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ❌ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    const message = `\n🚨 Environment Validation Failed:\n${formatted}\n`;

    if (isProd) {
      throw new Error(message);
    } else {
      console.warn(message);
      return process.env as unknown as z.infer<typeof serverSchema>;
    }
  }

  return result.data;
}

export const env = validateEnv();
