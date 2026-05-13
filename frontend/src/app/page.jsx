'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import VideoCard from '@/components/VideoCard';
import { ApiError, extractJobId, getVideos } from '@/lib/api';

function VideoListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchVideos = useCallback(async () => {
    setError('');
    try {
      const data = await getVideos();
      setVideos(data);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Could not load videos. Is the backend running on port 4000?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    const hasProcessing = videos.some(
      (v) => v.job?.status === 'processing' || v.job?.status === 'queued'
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => void fetchVideos(), 2500);
    return () => clearInterval(interval);
  }, [videos, fetchVideos]);

  const handleUploadComplete = (data) => {
    void fetchVideos();
    const jobId = extractJobId(data);
    if (jobId) {
      router.push(`/results/${jobId}`);
    }
  };

  const processingCount = videos.filter(
    (v) => v.job?.status === 'processing' || v.job?.status === 'queued'
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      <header className="border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-amber-400 text-xl shrink-0" aria-hidden>🔍</span>
            <div className="min-w-0">
              <h1 className="font-bold text-zinc-100 tracking-tight">CatVision</h1>
              <p className="text-xs text-zinc-500 font-mono truncate">
                Video analysis dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void fetchVideos();
              }}
              disabled={loading}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 disabled:opacity-40 transition-colors"
            >
              Refresh
            </button>
            {processingCount > 0 && (
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden />
                {processingCount} active
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Upload video
          </h2>
          <UploadZone onUploadComplete={handleUploadComplete} />
        </section>

        <section aria-labelledby="library-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="library-heading" className="text-sm font-mono text-zinc-500 uppercase tracking-widest">
              Your videos
            </h2>
            <span className="text-xs font-mono text-zinc-600">{videos.length} total</span>
          </div>

          {loading && <VideoListSkeleton />}

          {!loading && error && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-6 text-center space-y-3">
              <p className="text-red-400 font-mono text-sm">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void fetchVideos();
                }}
                className="text-xs font-mono px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-600 font-mono text-sm">
                No videos yet. Upload one above.
              </p>
            </div>
          )}

          {!loading && !error && videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
