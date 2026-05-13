const origin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export const API_ORIGIN = origin;
export const API_BASE = `${origin}/api`;

export const UPLOADS_ORIGIN = origin;
