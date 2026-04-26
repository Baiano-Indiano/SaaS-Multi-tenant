/**
 * OpenAPI 3.1 Specification for the SaaS Multi-tenant API
 * 
 * This file serves as the source of truth for the API Playground (Scalar).
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Enterprise Edge API',
    version: '1.0.0',
    description: 'Direct programmatic access to your tenant resources. Authenticate using Bearer tokens generated in your dashboard.',
    contact: {
      name: 'API Support',
      url: 'https://support.example.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Main API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Your secret API Key (e.g., sk_live_...)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
      TenantContext: {
        type: 'object',
        properties: {
          organization: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
            },
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              role: { type: 'string' },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/v1/me': {
      get: {
        summary: 'Get Current Context',
        description: 'Returns the organization and user context associated with the provided API Key. Use this for initial connection testing.',
        operationId: 'getMe',
        tags: ['Diagnostic'],
        responses: {
          '200': {
            description: 'Context information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TenantContext',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/v1/pose/current': {
      get: {
        summary: 'Get Current Pose (Placeholder)',
        description: 'Returns the most recent pose data detected for this tenant. [Endpoint in Development]',
        operationId: 'getCurrentPose',
        tags: ['Real-time Data'],
        responses: {
          '200': {
            description: 'Pose data',
          },
        },
      },
    },
    '/v1/pose/stats': {
      get: {
        summary: 'Get Pose Stats (Placeholder)',
        description: 'Returns historical pose statistics for this tenant. [Endpoint in Development]',
        operationId: 'getPoseStats',
        tags: ['Analytics'],
        responses: {
          '200': {
            description: 'Analytics summary',
          },
        },
      },
    },
  },
};
