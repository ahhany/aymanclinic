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
    },
  };
}
