// Shared context passed to delegated route modules (server/attachments.ts,
// server/dashboards.ts). handler.ts owns auth and the helpers; delegates
// return true when they handled the request.

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PrismaClient } from '@prisma/client';

export type AuthedUser = { id: string; name: string; role: string };

export interface RouteCtx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  /** Path with the leading slash stripped, e.g. "patients/abc/attachments". */
  path: string;
  method: string;
  user: AuthedUser;
  prisma: PrismaClient;
  json: (res: ServerResponse, status: number, body: unknown) => void;
  readBody: (req: IncomingMessage) => Promise<Record<string, unknown>>;
  audit: (userId: string | null, action: string, entity: string, entityId?: string, detail?: string) => Promise<void>;
}
