// Vite plugin that mounts the dev API on /api inside the Vite dev server.
// One process, one port — `npm run dev -- --host --port 7100` just works.
// Production replaces this with Supabase (decisions D6/D20).

import type { Plugin } from 'vite';
import { handleApiRequest } from './handler';

export function clinicApiPlugin(): Plugin {
  return {
    name: 'clinic-api',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        void handleApiRequest(req, res).catch((err: unknown) => {
          console.error('[clinic-api]', err);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'internal_error' }));
        });
      });
      // The middleware module graph (including the Prisma client) is captured
      // in the Vite config bundle and does NOT hot-reload. Restart the dev
      // server when the API layer or the schema/migrations change — otherwise
      // a long-running server serves stale clients after a migration (this
      // caused the blank patient page on the preview on 2026-11-06).
      server.watcher.add(['server/**', 'prisma/schema.prisma', 'prisma/migrations/**', 'prisma/seed.ts']);
      server.watcher.on('change', (file: string) => {
        if (/[\\/]server[\\/]/.test(file) || /prisma[\\/](schema\.prisma|seed\.ts|migrations[\\/])/.test(file)) {
          console.log('[clinic-api] change detected, restarting dev server:', file);
          void server.restart();
        }
      });
    },
  };
}
