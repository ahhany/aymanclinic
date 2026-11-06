// Attachment routes (Phase 1 slice 3).
// POST   patients/:id/attachments   — manual multipart parsing (no new deps)
// GET    attachments/:id/file       — stream the stored file (inline)
// DELETE attachments/:id            — remove row + stored file
// Files live under <project root>/uploads (dev-server CWD is the project root).

import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { RouteCtx } from './ctx';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 1024 * 1024; // headroom for multipart framing
const ATTACHMENT_TYPES = new Set(['ultrasound', 'report', 'lab_scan', 'other']);
const UPLOADS_DIR = 'uploads';

const CRLF = Buffer.from('\r\n');
const HEADER_SPLIT = Buffer.from('\r\n\r\n');

interface MultipartPart {
  name: string;
  filename: string | null;
  contentType: string | null;
  data: Buffer;
}

/** Drain the request into a single Buffer, discarding (but draining) beyond the cap. */
function readRawBody(req: IncomingMessage): Promise<{ body: Buffer; tooLarge: boolean }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let tooLarge = false;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_REQUEST_BYTES) {
        tooLarge = true;
        return; // keep draining so the connection completes cleanly
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve({ body: Buffer.concat(chunks), tooLarge }));
    req.on('error', reject);
  });
}

/**
 * Split a multipart/form-data body on its boundary. Binary-safe (Buffer-based);
 * the browser-chosen boundary is random, so a collision inside file bytes is
 * not a practical concern for the dev API.
 */
function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts: MultipartPart[] = [];
  let cursor = body.indexOf(boundaryBuf);
  while (cursor !== -1) {
    const next = body.indexOf(boundaryBuf, cursor + boundaryBuf.length);
    if (next === -1) break; // final boundary (trailing "--") — stop
    let part = body.subarray(cursor + boundaryBuf.length, next);
    if (part.subarray(0, 2).equals(CRLF)) part = part.subarray(2);
    if (part.length >= 2 && part.subarray(part.length - 2).equals(CRLF)) {
      part = part.subarray(0, part.length - 2);
    }
    const headerEnd = part.indexOf(HEADER_SPLIT);
    if (headerEnd !== -1) {
      const rawHeaders = part.subarray(0, headerEnd).toString('latin1');
      const data = part.subarray(headerEnd + HEADER_SPLIT.length);
      const disposition = /content-disposition:\s*form-data;([^\r\n]*)/i.exec(rawHeaders)?.[1] ?? '';
      const name = /name="([^"]*)"/.exec(disposition)?.[1] ?? '';
      const rawFilename = /filename="([^"]*)"/.exec(disposition)?.[1] ?? null;
      // Browsers send UTF-8 filenames; headers were read as latin1, so re-decode.
      const filename = rawFilename ? Buffer.from(rawFilename, 'latin1').toString('utf8') : null;
      const contentType = /content-type:\s*([^\r\n;]+)/i.exec(rawHeaders)?.[1]?.trim() ?? null;
      parts.push({ name, filename, contentType, data });
    }
    cursor = next;
  }
  return parts;
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^\w.\-() ]+/g, '_').trim();
  return cleaned.slice(0, 120) || 'file';
}

function isAllowedMime(mime: string): boolean {
  return mime === 'application/pdf' || mime.startsWith('image/');
}

export async function handleAttachmentRoutes(ctx: RouteCtx): Promise<boolean> {
  const { req, res, path: routePath, method, user, prisma, json, audit } = ctx;

  // ---------- POST patients/:id/attachments ----------
  const uploadMatch = /^patients\/([^/]+)\/attachments$/.exec(routePath);
  if (uploadMatch && method === 'POST') {
    const patientId = uploadMatch[1];
    const contentType = req.headers['content-type'] ?? '';
    const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    const boundary = (boundaryMatch?.[1] ?? boundaryMatch?.[2])?.trim();
    if (!contentType.toLowerCase().includes('multipart/form-data') || !boundary) {
      json(res, 400, { error: 'multipart_form_data_required' });
      return true;
    }

    const { body, tooLarge } = await readRawBody(req);
    if (tooLarge) {
      json(res, 413, { error: 'file_too_large' });
      return true;
    }

    const parts = parseMultipart(body, boundary);
    const filePart = parts.find((p) => p.name === 'file' && p.filename);
    if (!filePart || !filePart.filename || filePart.data.length === 0) {
      json(res, 400, { error: 'file is required' });
      return true;
    }
    if (filePart.data.length > MAX_FILE_BYTES) {
      json(res, 413, { error: 'file_too_large' });
      return true;
    }

    const field = (name: string): string => {
      const part = parts.find((p) => p.name === name && !p.filename);
      return part ? part.data.toString('utf8').trim() : '';
    };
    const typeRaw = field('type');
    const type = ATTACHMENT_TYPES.has(typeRaw) ? typeRaw : null;
    if (typeRaw && !type) {
      json(res, 400, { error: 'invalid type (ultrasound | report | lab_scan | other)' });
      return true;
    }
    const note = field('note') || null;
    const episodeId = field('episodeId') || null;

    const mimeType = filePart.contentType ?? 'application/octet-stream';
    if (!isAllowedMime(mimeType)) {
      json(res, 415, { error: 'unsupported_media_type' });
      return true;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      json(res, 404, { error: 'not_found' });
      return true;
    }

    let ownerType = 'patient';
    let ownerId: string | null = null;
    if (episodeId) {
      const episode = await prisma.episode.findUnique({ where: { id: episodeId } });
      if (!episode || episode.patientId !== patientId) {
        json(res, 400, { error: 'episode_not_found' });
        return true;
      }
      ownerType = 'episode';
      ownerId = episode.id;
    }

    const id = randomUUID();
    const storedName = `${id}-${sanitizeFilename(filePart.filename)}`;
    // Forward slashes even on Windows — Node accepts them, and storagePath
    // stays portable (D6).
    const storagePath = `${UPLOADS_DIR}/${storedName}`;

    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(storagePath, filePart.data);

    try {
      await prisma.attachment.create({
        data: {
          id,
          patientId,
          ownerType,
          ownerId,
          storagePath,
          type: type ?? 'other',
          fileName: filePart.filename,
          mimeType,
          sizeBytes: filePart.data.length,
          note,
          uploadedById: user.id,
        },
      });
    } catch (err) {
      // Do not leave an orphaned file behind when the row fails.
      await unlink(storagePath).catch(() => {});
      throw err;
    }

    await audit(user.id, 'create', 'attachment', id, `${filePart.filename} (${filePart.data.length} bytes)`);
    json(res, 201, { id });
    return true;
  }

  // ---------- GET attachments/:id/file ----------
  const fileMatch = /^attachments\/([^/]+)\/file$/.exec(routePath);
  if (fileMatch && method === 'GET') {
    const row = await prisma.attachment.findUnique({ where: { id: fileMatch[1] } });
    if (!row) {
      json(res, 404, { error: 'not_found' });
      return true;
    }
    const stream = createReadStream(row.storagePath);
    stream.on('open', () => {
      // RFC 5987: ASCII fallback + percent-encoded UTF-8 — Arabic names must
      // never reach a raw header (Node throws ERR_INVALID_CHAR).
      const asciiName = row.fileName.replace(/["\\\r\n]+/g, '_').replace(/[^\x20-\x7e]/g, '_') || 'file';
      const encodedName = encodeURIComponent(row.fileName).replace(/'/g, '%27');
      res.statusCode = 200;
      res.setHeader('content-type', row.mimeType || 'application/octet-stream');
      res.setHeader('content-disposition', `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);
      if (row.sizeBytes > 0) res.setHeader('content-length', String(row.sizeBytes));
      stream.pipe(res);
    });
    stream.on('error', () => {
      if (!res.headersSent) json(res, 404, { error: 'file_missing' });
      else res.destroy();
    });
    return true;
  }

  // ---------- DELETE attachments/:id ----------
  const deleteMatch = /^attachments\/([^/]+)$/.exec(routePath);
  if (deleteMatch && method === 'DELETE') {
    const row = await prisma.attachment.findUnique({ where: { id: deleteMatch[1] } });
    if (!row) {
      json(res, 404, { error: 'not_found' });
      return true;
    }
    await prisma.attachment.delete({ where: { id: row.id } });
    await unlink(row.storagePath).catch(() => {}); // row is gone; a missing file is not an error
    await audit(user.id, 'delete', 'attachment', row.id, row.fileName);
    json(res, 200, { ok: true });
    return true;
  }

  return false;
}
