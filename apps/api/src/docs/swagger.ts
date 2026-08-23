import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'QueueFlow API Reference',
    version: '1.0.0',
    description: 'Distributed job processing & notification platform API documentation.',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System Health Check',
        responses: {
          200: { description: 'System is healthy' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'User Registration',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'User Login',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
        },
      },
    },
    '/api/jobs': {
      post: {
        summary: 'Create Asynchronous Job',
        description: 'Enqueues job to BullMQ queue and returns 202 Accepted immediately.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['EMAIL', 'WEBHOOK', 'REPORT'] },
                  payload: { type: 'object' },
                  priority: { type: 'integer', default: 1 },
                },
                required: ['type', 'payload'],
              },
            },
          },
        },
        responses: {
          202: { description: 'Job Accepted & Queued' },
        },
      },
      get: {
        summary: 'List Jobs (Paginated & Filtered)',
        responses: {
          200: { description: 'List of jobs' },
        },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
