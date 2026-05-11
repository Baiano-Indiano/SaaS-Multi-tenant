/**
 * OpenAPI 3.1 Specification for the SaaS Multi-tenant API
 * 
 * This file serves as the source of truth for the API Playground (Scalar).
 * It dynamically generates the spec using zod-to-openapi and merges documentation guides.
 */

import { generateOpenApiSpec } from "./openapi-generator";
import { ALL_GUIDES } from "./guides";

const baseSpec = generateOpenApiSpec();

// Enrich spec with Scalar-specific extensions for guides
export const openApiSpec = {
  ...baseSpec,
  "x-scalar-pages": ALL_GUIDES.map(guide => ({
    title: guide.title,
    content: guide.content,
  })),
};
