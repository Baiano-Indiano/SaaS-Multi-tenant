import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// --- Security Schemes ---
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  description: "Your secret API Key (e.g., sk_live_...)",
});

// --- Common Schemas ---
const ErrorSchema = registry.register(
  "Error",
  z.object({
    error: z.string().openapi({ example: "Unauthorized" }),
    code: z.string().optional().openapi({ example: "UNAUTHORIZED" }),
    details: z.string().optional().openapi({ example: "Invalid API Key" }),
  })
);

const TenantContextSchema = registry.register(
  "TenantContext",
  z.object({
    tenantId: z.string().openapi({ example: "org_123" }),
    schema: z.string().openapi({ example: "tenant_org_123" }),
    roleId: z.string().nullable().openapi({ example: "role_admin" }),
    status: z.string().openapi({ example: "active" }),
    timestamp: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
);

const PoseDataSchema = registry.register(
  "PoseData",
  z.object({
    available: z.boolean().openapi({ example: false }),
    source: z.string().openapi({ example: "saas-multi-tenant" }),
    message: z.string().openapi({ example: "Pose service is not enabled in this project." }),
    current: z.any().nullable(),
  })
);

const PoseStatsSchema = registry.register(
  "PoseStats",
  z.object({
    available: z.boolean().openapi({ example: false }),
    source: z.string().openapi({ example: "saas-multi-tenant" }),
    message: z.string().openapi({ example: "Pose service is not enabled in this project." }),
    hours: z.number().openapi({ example: 1 }),
    stats: z.object({
      samples: z.number().openapi({ example: 0 }),
      lastUpdatedAt: z.string().nullable(),
    }),
  })
);

const HealthStatusSchema = registry.register(
  "HealthStatus",
  z.object({
    status: z.string().openapi({ example: "UP" }),
    database: z.string().openapi({ example: "UP" }),
    cache: z.string().openapi({ example: "UP" }),
    timestamp: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
);

// --- Path Registrations ---

registry.registerPath({
  method: "get",
  path: "/v1/health",
  summary: "Health Check",
  description: "Check the operational status of the API and its core dependencies (Database and Cache). No authentication required.",
  operationId: "getHealth",
  tags: ["Diagnostic"],
  responses: {
    200: {
      description: "System is operational",
      content: {
        "application/json": {
          schema: HealthStatusSchema,
        },
      },
    },
    503: {
      description: "Service unavailable or degraded",
      content: {
        "application/json": {
          schema: HealthStatusSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/me",
  summary: "Get Current Context",
  description: "Returns the organization and user context associated with the provided API Key. Use this for initial connection testing.",
  operationId: "getMe",
  tags: ["Diagnostic"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Context information",
      content: {
        "application/json": {
          schema: TenantContextSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/pose/current",
  summary: "Get Current Pose",
  description: "Returns the most recent pose data detected for this tenant. [Endpoint in Development]",
  operationId: "getCurrentPose",
  tags: ["Real-time Data"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Pose data",
      content: {
        "application/json": {
          schema: PoseDataSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/pose/stats",
  summary: "Get Pose Stats",
  description: "Returns historical pose statistics for this tenant. [Endpoint in Development]",
  operationId: "getPoseStats",
  tags: ["Analytics"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      hours: z.string().optional().openapi({ description: "Number of hours to retrieve stats for", example: "24" }),
    }),
  },
  responses: {
    200: {
      description: "Analytics summary",
      content: {
        "application/json": {
          schema: PoseStatsSchema,
        },
      },
    },
  },
});

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Enterprise Edge API",
      version: "1.0.0",
      description: "Direct programmatic access to your tenant resources. Authenticate using Bearer tokens generated in your dashboard.",
      contact: {
        name: "API Support",
        url: "https://support.example.com",
      },
    },
    servers: [
      {
        url: "/api",
        description: "Main API Gateway",
      },
    ],
  });
}
