import { API_BASE } from './config';

function safeJsonParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Normalized API failure (works with `{ error: { message, code } }` and legacy `{ error: "string" }`).
 */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function parseErrorPayload(body, status) {
  const err = body?.error;
  if (typeof err === 'string') {
    return new ApiError(err, status, 'ERROR');
  }
  if (err && typeof err === 'object') {
    const message = err.message || `Request failed (${status})`;
    return new ApiError(message, status, err.code || 'ERROR');
  }
  return new ApiError(`Request failed (${status})`, status, 'ERROR');
}

async function parseJsonResponse(res) {
  const text = await res.text();
  const parsed = safeJsonParse(text);
  const data = typeof parsed === 'object' && parsed !== null ? parsed : {};
  if (!res.ok) {
    throw parseErrorPayload(data, res.status);
  }
  return data;
}

function normalizeArrayResponse(data, fallbackKeys = []) {
  if (Array.isArray(data)) return data;
  for (const key of fallbackKeys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

export function extractJobId(data) {
  return data?.jobId || data?.job?.id || data?.job?.jobId || data?.id || null;
}

export async function getVideos() {
  const res = await fetch(`${API_BASE}/videos`, { cache: 'no-store' });
  const data = await parseJsonResponse(res);
  return normalizeArrayResponse(data, ['videos', 'data']);
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/status`, { cache: 'no-store' });
  return parseJsonResponse(res);
}

export async function getJobResults(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/results`, { cache: 'no-store' });
  const data = await parseJsonResponse(res);
  return normalizeArrayResponse(data, ['frames', 'results', 'data']);
}

export function uploadVideo(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      const data = safeJsonParse(xhr.responseText) || {};
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(parseErrorPayload(data, xhr.status));
      }
    };

    xhr.onerror = () => reject(new ApiError('Network error — is the API running?', 0, 'NETWORK'));
    xhr.open('POST', `${API_BASE}/videos/upload`);
    xhr.send(formData);
  });
}
