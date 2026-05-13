'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FrameTimeline from '@/components/FrameTimeline';
import { ApiError, getJobStatus, getJobResults } from '@/lib/api';
import { UPLOADS_ORIGIN } from '@/lib/config';

const STATUS_LABEL = {
  queued:     { text: 'Queued',     color: 'text-zinc-400' },
  processing: { text: 'Processing', color: 'text-amber-400' },
  done:       { text: 'Done',       color: 'text-green-400' },
  failed:     { text: 'Failed',     color: 'text-red-400'   },
};

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-pulse" aria-busy="true">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-4 w-24 bg-zinc-800 rounded" />
        <div className="aspect-video bg-zinc-900 border border-zinc-800 rounded-xl" />
        <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
      <div className="lg:col-span-3 space-y-4">
        <div className="h-4 w-32 bg-zinc-800 rounded" />
        <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const videoRef = useRef(null);

  const [job, setJob] = useState(null);
  const [frames, setFrames] = useState([]);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  const videoUrl = job?.video
    ? `${UPLOADS_ORIGIN}/uploads/videos/${job.video.filename}`
    : null;

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getJobStatus(jobId);
      setJob(data);
      setError('');
      return data.status;
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 404
          ? 'This job no longer exists or the link is invalid.'
          : e instanceof ApiError
            ? e.message
            : 'Could not load job status.';
      setError(msg);
      setJob(null);
      return null;
    }
  }, [jobId]);

  const fetchResults = useCallback(async (status) => {
    if (status !== 'done') return;

    try {
      const data = await getJobResults(jobId);
      setFrames(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError('This job no longer exists or the link is invalid.');
      } else if (status === 'done') {
        setError(
          e instanceof ApiError ? e.message : 'Could not load frame results.'
        );
      }
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      setError('');
      const status = await fetchStatus();
      if (!cancelled) {
        await fetchResults(status);
        setInitialLoad(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchStatus, fetchResults]);

  useEffect(() => {
    if (!job) return;
    if (job.status === 'done' || job.status === 'failed') return;

    const interval = setInterval(async () => {
      const status = await fetchStatus();
      await fetchResults(status);
    }, 2000);

    return () => clearInterval(interval);
  }, [job, fetchStatus, fetchResults]);

  const seekTo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  };

  const s = job ? (STATUS_LABEL[job.status] || STATUS_LABEL.queued) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      <header className="border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 rounded px-1"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-zinc-800" aria-hidden />
          <span className="text-amber-400 text-xl" aria-hidden>🔍</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-zinc-100 tracking-tight text-sm truncate">
              {job?.video?.originalName || (initialLoad && !error ? 'Loading…' : 'Results')}
            </h1>
            <p className="text-xs font-mono text-zinc-600 truncate">job/{jobId}</p>
          </div>
          {s && job && (
            <span className={`text-xs font-mono flex items-center gap-1.5 shrink-0 ${s.color}`}>
              {job.status === 'processing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden />
              )}
              {s.text}
              {job.status === 'processing' && ` · ${job.progress}%`}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {error && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-6 py-10 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-red-400 font-mono text-sm">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInitialLoad(true);
                  void (async () => {
                    const status = await fetchStatus();
                    await fetchResults(status);
                    setInitialLoad(false);
                  })();
                }}
                className="text-xs font-mono px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-xs font-mono px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {!error && initialLoad && <ResultsSkeleton />}

        {!error && !initialLoad && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Preview
              </h2>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {videoUrl ? (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-zinc-600 font-mono text-xs">No preview</p>
                )}
              </div>

              {job && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">Status</span>
                    <span className={s?.color}>{s?.text}</span>
                  </div>
                  {job.status === 'processing' && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Progress</span>
                        <span className="text-amber-400">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {job.startedAt && (
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Started</span>
                      <span className="text-zinc-400">
                        {new Date(job.startedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {job.completedAt && (
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Completed</span>
                      <span className="text-zinc-400">
                        {new Date(job.completedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {job.totalFrames > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Frames</span>
                      <span className="text-zinc-400">{job.totalFrames}</span>
                    </div>
                  )}
                  {job.errorMsg && (
                    <div className="pt-1 text-red-400 break-words">{job.errorMsg}</div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Frame analysis
              </h2>

              {(job?.status === 'queued' || job?.status === 'processing') && frames.length === 0 && (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
                  <div className="text-3xl mb-3" aria-hidden>⚙️</div>
                  <p className="text-zinc-500 font-mono text-sm">
                    Analysing frames… {job.progress}%
                  </p>
                  <p className="text-zinc-700 font-mono text-xs mt-1">
                    Results appear when processing finishes
                  </p>
                </div>
              )}

              {frames.length > 0 && (
                <FrameTimeline frames={frames} onSeek={seekTo} />
              )}

              {job?.status === 'failed' && frames.length === 0 && (
                <div className="text-center py-20 border border-dashed border-red-900/30 rounded-xl">
                  <p className="text-red-400 font-mono text-sm">Processing failed</p>
                  <p className="text-zinc-600 font-mono text-xs mt-1 break-words">{job.errorMsg}</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
