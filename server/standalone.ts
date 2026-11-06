// Standalone production API — the same handleApiRequest the Vite dev
// middleware mounts (server/api.ts), served as its own Node process for
// hosted deployments (Render/Fly/etc., see knowledge/deployment-plan.md).
//
// Env:
//   PORT         — listen port (default 8080)
//   DATABASE_URL — Supabase Postgres in production (D6)
//   CORS_ORIGIN  — allowed frontend origin(s), comma-separated
//                  (e.g. https://aymanclinic.vercel.app,https://xxx.lovable.app)
//                  Defaults to * (acceptable for the fictional-data pilot only).

import { createServer } from 'node:http';
import { handleApiRequest } from './handler';

const port = Number(process.env.PORT ?? 8080);
const allowed = (process.env.CORS_ORIGIN ?? '*').split(',').map((s) => s.trim());

const server = createServer((req, res) => {
  const origin = req.headers.origin;
  const allowOrigin =
    allowed.includes('*') ? '*' : origin && allowed.includes(origin) ? origin : allowed[0];
  res.setHeader('access-control-allow-origin', allowOrigin);
  res.setHeader('access-control-allow-headers', 'content-type, x-dev-token');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api')) {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end('aymanclinic api — use /api/*\n');
    return;
  }
  // Strip the /api mount prefix, exactly like the Vite middleware does.
  req.url = url.pathname.slice(4) + url.search;

  void handleApiRequest(req, res).catch((err: unknown) => {
    console.error('[clinic-api]', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'internal_error' }));
  });
});

server.listen(port, () => {
  console.log(`[clinic-api] listening on :${port} (CORS: ${allowed.join(', ')})`);
});
