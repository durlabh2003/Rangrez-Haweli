import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server.js';

// Vercel serverless entry: one Express app instance per warm function.
const appPromise = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
