// Attachments section of the patient file — upload (image/PDF, ≤ 15 MB),
// list with inline image thumbnails, and delete. Files are opened via
// /api/attachments/<id>/file?token=… so <a>/<img> can authenticate (D20).

import { useState, type FormEvent } from 'react';
import { useApi, API_BASE } from '../db/apiClient';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { MODULE_LABELS } from '../i18n/sections';
import { formatDate } from '../lib/dates';
import { Button } from './ui/button';

export interface AttachmentDto {
  id: string;
  ownerType: string;
  ownerId: string | null;
  type: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string | null;
  createdAt: string;
}

export interface AttachmentEpisodeOption {
  id: string;
  type: string;
  status: string;
}

const TYPE_VALUES = ['ultrasound', 'report', 'lab_scan', 'other'] as const;

const L = {
  en: {
    title: 'Attachments',
    titleAr: 'المرفقات',
    patientFile: 'Patient file',
    episode: 'Attach to',
    note: 'Note (optional)',
    upload: 'Upload',
    uploading: 'Uploading…',
    empty: 'No attachments yet.',
    confirmDelete: 'Delete this attachment?',
    delete: 'Delete',
    uploadError: 'Upload failed — only images and PDF up to 15 MB are allowed.',
    deleteError: 'Could not delete this attachment.',
    typeLabels: { ultrasound: 'Ultrasound', report: 'Report', lab_scan: 'Lab scan', other: 'Other' } as Record<string, string>,
  },
  ar: {
    title: 'Attachments',
    titleAr: 'المرفقات',
    patientFile: 'ملف المريضة',
    episode: 'إرفاق إلى',
    note: 'ملاحظة (اختياري)',
    upload: 'رفع',
    uploading: 'جارٍ الرفع…',
    empty: 'لا توجد مرفقات بعد.',
    confirmDelete: 'حذف هذا المرفق؟',
    delete: 'حذف',
    uploadError: 'فشل الرفع — يُسمح بالصور وملفات PDF فقط حتى 15 ميجابايت.',
    deleteError: 'تعذر حذف هذا المرفق.',
    typeLabels: { ultrasound: 'سونار', report: 'تقرير', lab_scan: 'تحليل ممسوح', other: 'أخرى' } as Record<string, string>,
  },
};

const TYPE_CHIP_CLASS: Record<string, string> = {
  ultrasound: 'bg-clinic-blue/10 text-clinic-blue',
  report: 'bg-clinic-navy/10 text-clinic-navy',
  lab_scan: 'bg-clinic-red/10 text-clinic-red',
  other: 'bg-slate-100 text-slate-600',
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function AttachmentsSection({
  patientId,
  attachments,
  episodes,
  onReload,
}: {
  patientId: string;
  attachments: AttachmentDto[];
  episodes: AttachmentEpisodeOption[];
  onReload: () => void;
}) {
  const api = useApi();
  const { state } = useAuth();
  const { lang } = useI18n();
  const l = lang === 'ar' ? L.ar : L.en;
  const token = state?.token ?? '';

  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>('other');
  const [note, setNote] = useState('');
  const [episodeId, setEpisodeId] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileUrl = (id: string) => `${API_BASE}/api/attachments/${id}/file?token=${encodeURIComponent(token)}`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);
      if (note.trim()) form.append('note', note.trim());
      if (episodeId) form.append('episodeId', episodeId);
      await api.upload(`patients/${patientId}/attachments`, form);
      setFile(null);
      setType('other');
      setNote('');
      setEpisodeId('');
      setInputKey((k) => k + 1); // reset the file input
      onReload();
    } catch {
      setError(l.uploadError);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(l.confirmDelete)) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/attachments/${id}`, {
        method: 'DELETE',
        headers: token ? { 'x-dev-token': token } : undefined,
      });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);
      onReload();
    } catch {
      setError(l.deleteError);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-clinic-line bg-white">
      <div className="section-header">
        <span className="text-sm font-semibold tracking-wide">
          {l.title}
          <span className="mx-2 text-white/40">·</span>
          <span className="font-normal">{l.titleAr}</span>
        </span>
      </div>
      <div className="space-y-3 p-3">
        {attachments.length === 0 ? (
          <p className="text-sm text-slate-400">{l.empty}</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((a) => {
              const isImage = a.mimeType.startsWith('image/');
              return (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  {isImage ? (
                    <a href={fileUrl(a.id)} target="_blank" rel="noreferrer">
                      <img
                        src={fileUrl(a.id)}
                        alt={a.fileName}
                        className="h-12 w-12 rounded border border-clinic-line object-cover"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-12 w-12 items-center justify-center rounded border border-clinic-line bg-clinic-paper text-[10px] font-bold text-clinic-red"
                    >
                      PDF
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={fileUrl(a.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-medium text-clinic-blue hover:underline"
                      >
                        {a.fileName}
                      </a>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${TYPE_CHIP_CLASS[a.type ?? 'other'] ?? TYPE_CHIP_CLASS.other}`}
                      >
                        {l.typeLabels[a.type ?? 'other'] ?? a.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(a.createdAt)} · {formatSize(a.sizeBytes)}
                      {a.note ? ` · ${a.note}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(a.id)}
                    className="cursor-pointer text-xs font-medium text-clinic-red hover:underline"
                  >
                    {l.delete}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={onSubmit} className="space-y-2 rounded-md border border-clinic-line bg-clinic-paper p-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <input
              key={inputKey}
              type="file"
              accept="image/*,application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 py-1.5 text-sm file:me-2 file:rounded file:border-0 file:bg-clinic-blue/10 file:px-2 file:text-clinic-blue"
              aria-label="File"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 rounded-md border border-clinic-line bg-white px-2 text-sm"
              aria-label="Type"
            >
              {TYPE_VALUES.map((tv) => (
                <option key={tv} value={tv}>
                  {l.typeLabels[tv]}
                </option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={l.note}
              className="h-10 w-full rounded-md border border-clinic-line bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-clinic-blue"
              aria-label="Note"
            />
            <select
              value={episodeId}
              onChange={(e) => setEpisodeId(e.target.value)}
              className="h-10 rounded-md border border-clinic-line bg-white px-2 text-sm"
              aria-label={l.episode}
            >
              <option value="">{l.patientFile}</option>
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {MODULE_LABELS[ep.type]?.[0] ?? ep.type} ({ep.status})
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs font-medium text-clinic-red">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!file || busy}>
              {busy ? l.uploading : l.upload}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
