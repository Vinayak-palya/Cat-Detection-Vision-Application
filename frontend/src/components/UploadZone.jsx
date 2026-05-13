'use client';

import { useState, useRef } from 'react';
import { uploadVideo } from '@/lib/api';
import { MAX_CLIENT_VIDEO_BYTES } from '@/lib/constants';

export default function UploadZone({ onUploadComplete }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validate = (file) => {
    if (!file.type.startsWith('video/')) {
      return 'Only video files are allowed.';
    }
    if (file.size > MAX_CLIENT_VIDEO_BYTES) {
      return 'File must be 50 MB or smaller.';
    }
    return null;
  };

  const handleFile = async (file) => {
    setError('');
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const data = await uploadVideo(file, setProgress);
      onUploadComplete(data);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const zoneLabel = dragging ? 'Drop video here' : 'Drop a video or click to browse';

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label={zoneLabel}
        aria-busy={uploading}
        onKeyDown={(e) => {
          if (!uploading && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
          ${dragging
            ? 'border-amber-400 bg-amber-400/5'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
          }
          ${uploading ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="sr-only"
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="text-3xl" aria-hidden>⏳</div>
            <p className="text-zinc-300 font-mono text-sm">Uploading… {progress}%</p>
            <div
              className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-2 bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl" aria-hidden>🎬</div>
            <p className="text-zinc-200 font-semibold text-lg">{zoneLabel}</p>
            <p className="text-zinc-500 font-mono text-xs">
              MP4, MOV, AVI · Max 50 MB · Max 60 seconds
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-red-400 font-mono text-sm text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
