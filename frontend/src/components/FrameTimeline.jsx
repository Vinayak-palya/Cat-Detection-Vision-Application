'use client';

import { useState } from 'react';

export default function FrameTimeline({ frames, onSeek }) {
  const [hoveredFrame, setHoveredFrame] = useState(null);

  if (!frames || frames.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-600 font-mono text-sm">
        No frame data available yet.
      </div>
    );
  }

  const catFrames   = frames.filter(f => f.label === 'cat_present').length;
  const totalFrames = frames.length;
  const catPercent  = Math.round((catFrames / totalFrames) * 100);

  return (
    <div className="space-y-6">
      <p className="text-xs font-mono text-zinc-600">
        Cat is only reported when confidence is at least 75%; anything below that is treated as not a cat.
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
          <p className="text-2xl font-bold text-zinc-100 font-mono">{totalFrames}</p>
          <p className="text-xs text-zinc-500 mt-1">Total frames</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-green-900/40 p-4 text-center">
          <p className="text-2xl font-bold text-green-400 font-mono">{catFrames}</p>
          <p className="text-xs text-zinc-500 mt-1">Cat detected</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400 font-mono">{catPercent}%</p>
          <p className="text-xs text-zinc-500 mt-1">Cat presence</p>
        </div>
      </div>

      {/* Visual timeline */}
      <div>
        <p className="text-xs font-mono text-zinc-500 mb-2">Frame-by-frame timeline</p>
        <div className="flex gap-0.5 rounded-lg overflow-hidden h-10">
          {frames.map((frame) => (
            <button
              key={frame.id}
              onClick={() => onSeek && onSeek(frame.timestampSec)}
              onMouseEnter={() => setHoveredFrame(frame)}
              onMouseLeave={() => setHoveredFrame(null)}
              title={`${frame.timestampSec}s — ${frame.label} (${(frame.confidence * 100).toFixed(1)}%)`}
              className={`
                flex-1 min-w-1 transition-opacity duration-100
                ${frame.label === 'cat_present'
                  ? 'bg-green-400 hover:bg-green-300'
                  : 'bg-zinc-700 hover:bg-zinc-600'
                }
              `}
            />
          ))}
        </div>

        {/* Hover tooltip */}
        {hoveredFrame && (
          <div className="mt-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-300">{hoveredFrame.timestampSec}s</span>
            {' · '}
            <span className={hoveredFrame.label === 'cat_present' ? 'text-green-400' : 'text-zinc-500'}>
              {hoveredFrame.label === 'cat_present' ? '🐱 cat_present' : 'cat_not_present'}
            </span>
            {hoveredFrame.confidence > 0 && (
              <span className="text-zinc-500"> · {(hoveredFrame.confidence * 100).toFixed(1)}% confidence</span>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
            <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />
            cat_present
          </span>
          <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
            <span className="w-3 h-3 rounded-sm bg-zinc-700 inline-block" />
            cat_not_present
          </span>
        </div>
      </div>

      {/* Predictions table */}
      <div>
        <p className="text-xs font-mono text-zinc-500 mb-2">All predictions</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 font-normal">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 font-normal">Label</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-zinc-500 font-normal">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((frame, i) => (
                <tr
                  key={frame.id}
                  onClick={() => onSeek && onSeek(frame.timestampSec)}
                  className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                    {frame.timestampSec.toFixed(1)}s
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono
                      ${frame.label === 'cat_present'
                        ? 'bg-green-400/10 text-green-400'
                        : 'bg-zinc-800 text-zinc-500'
                      }
                    `}>
                      {frame.label === 'cat_present' ? '🐱' : '—'} {frame.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-right">
                    {frame.confidence > 0
                      ? <span className="text-amber-400">{(frame.confidence * 100).toFixed(1)}%</span>
                      : <span className="text-zinc-700">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
