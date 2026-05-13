'use client';

import { useRouter } from 'next/navigation';

const STATUS_STYLES = {
  pending:    { dot: 'bg-zinc-500',  text: 'text-zinc-400',  label: 'Pending'    },
  queued:     { dot: 'bg-zinc-400',  text: 'text-zinc-400',  label: 'Queued'     },
  processing: { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400', label: 'Processing' },
  done:       { dot: 'bg-green-400', text: 'text-green-400', label: 'Done'       },
  failed:     { dot: 'bg-red-400',   text: 'text-red-400',   label: 'Failed'     },
};

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VideoCard({ video }) {
  const router = useRouter();
  const status = video.job?.status || 'pending';
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const progress = video.job?.progress ?? 0;
  const canOpen = Boolean(video.job?.id);

  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => canOpen && router.push(`/results/${video.job.id}`)}
      className="
        group w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-5
        hover:border-zinc-600 hover:bg-zinc-800/60
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-800 disabled:hover:bg-zinc-900
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
      "
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0" aria-hidden>🎞️</span>
          <p className="text-zinc-100 font-medium text-sm truncate">
            {video.originalName}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-mono shrink-0 ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden />
          {s.label}
        </span>
      </div>

      <div className="flex gap-4 text-xs font-mono text-zinc-500 mb-4">
        <span>{formatBytes(video.fileSize)}</span>
        <span>{video.durationSec?.toFixed(1)}s</span>
        <span>{formatDate(video.uploadedAt)}</span>
      </div>

      {(status === 'processing' || status === 'queued') && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-zinc-500">
            <span>{status === 'queued' ? 'Waiting to start' : 'Analysing frames'}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'done' && (
        <p className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
          Open results →
        </p>
      )}

      {status === 'failed' && (
        <p className="text-xs font-mono text-red-500 break-words max-h-16 overflow-y-auto">
          {video.job?.errorMsg || 'Processing failed'}
        </p>
      )}

      {!canOpen && (
        <p className="text-xs font-mono text-zinc-600">No job linked — cannot open results.</p>
      )}
    </button>
  );
}
