# Cat Detection Vision Application

End-to-end web app for **video upload**, **asynchronous frame sampling** (~1 frame per second), and **cat presence detection** using a **Roboflow** serverless workflow. Results are stored in a **SQL** database and shown in a **Next.js** dashboard with timestamps, labels, and confidence scores.

---

## Live deployments

| Component | URL |
|-----------|-----|
| **Frontend** (Next.js on Vercel) | [https://cat-detection-vision-application.vercel.app/](https://cat-detection-vision-application.vercel.app/) |
| **Backend** (Node API on Render) | [https://cat-detection-vision-application.onrender.com](https://cat-detection-vision-application.onrender.com) |

**Health check:** `GET https://cat-detection-vision-application.onrender.com/api/health`

The browser app must be configured with `NEXT_PUBLIC_API_URL` pointing at the backend origin (no trailing slash). In production this should match the Render URL above.

---

## Features

- Upload videos from the dashboard with progress feedback.
- Server validates **video MIME type**, **max file size (50 MB)**, and **max duration (60 seconds)** (aligned with the product brief in `docs/INTERNSHIP_ASSIGNMENT.md`).
- Background jobs: sample frames at **1 FPS**, run inference per frame, persist **frame-level** predictions.
- Labels: `cat_present` / `cat_not_present` with confidence; results keyed by **timestamp** (seconds).
- List past uploads, job status (`queued`, `processing`, `done`, `failed`), and a results view with timeline alignment.

---

## Architecture

```text
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Next.js   │ ─────────────► │  Express API     │
│  (Vercel)   │   REST + XHR   │  (Render)          │
└─────────────┘                └────────┬───────────┘
                                        │
                         ┌──────────────┼──────────────┐
                         ▼              ▼              ▼
                   SQLite (Prisma)  uploads/    Roboflow workflow
                   frame rows       disk video  (YOLO-world demo)
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Express 5, Multer (uploads), Fluent FFmpeg + static FFmpeg/FFprobe |
| Database | SQLite via Prisma ORM (`backend/prisma/schema.prisma`) |
| Vision | Roboflow serverless workflow (HTTP); `ROBOFLOW_API_KEY` required |

---

## Repository layout

```text
aristar/
├── backend/           # Express API, Prisma, video processing
│   ├── prisma/        # schema, migrations, dev.db (local)
│   ├── routes/        # /api/videos, /api/jobs
│   ├── services/      # upload, ffmpeg frames, Roboflow inference
│   └── uploads/       # stored video assets (created at runtime)
├── frontend/          # Next.js App Router UI
│   └── src/
│       ├── app/       # pages (home, results)
│       └── lib/       # API client, config
└── docs/              # assignment / product spec
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (or compatible client)
- **Roboflow API key** with access to the configured workflow (see `ROBOFLOW_WORKFLOW_URL` below)

---

## Local development

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set ROBOFLOW_API_KEY (and optional overrides below)
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The API listens on **http://localhost:4000** by default (`PORT` in `.env`).

### 2. Frontend

```bash
cd frontend
# Create .env.local with your API origin (must match backend CORS)
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > .env.local
npm install
npm run dev
```

Open **http://localhost:3000**.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `4000`; Render sets this automatically). |
| `CORS_ORIGIN` | No | Allowed browser origin for CORS (default `http://localhost:3000`). **In production, set this to your Vercel frontend URL.** |
| `ROBOFLOW_API_KEY` | **Yes** for inference | Roboflow API key; without it, uploads succeed but jobs fail at inference. |
| `ROBOFLOW_WORKFLOW_URL` | No | Override for the serverless workflow endpoint (default is set in `backend/config/constants.js`). |

Copy from `backend/.env.example` and replace placeholder values. **Do not commit real API keys.**

### Frontend (`frontend/.env.local` or Vercel env)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend base URL, **no trailing slash**, e.g. `http://localhost:4000` or `https://cat-detection-vision-application.onrender.com`. |

---

## HTTP API (summary)

Base path: `{API_ORIGIN}/api`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness: `{ ok, service, timestamp }`. |
| `GET` | `/videos` | List videos with nested `job` metadata. |
| `POST` | `/videos/upload` | Multipart field **`video`**; returns `video`, `jobId`, `job`. |
| `GET` | `/jobs/:jobId/status` | Job + embedded `video` (progress, status, errors). |
| `GET` | `/jobs/:jobId/results` | `{ data: FramePrediction[] }` ordered by `timestampSec`. |

Uploaded files are served under **`/uploads/...`** from the same origin as the API (used for video preview URLs returned by the API).

---

## Processing pipeline (backend)

1. **Upload** → video saved under `uploads/videos/`, `Video` + `ProcessingJob` rows created.
2. **FFmpeg** extracts frames at **1 FPS** into `uploads/frames/<jobId>/`.
3. Each frame image is sent to **Roboflow**; responses are mapped to `cat_present` / `cat_not_present` using `CAT_CONFIDENCE_THRESHOLD` (see `backend/config/constants.js`).
4. **`FramePrediction`** rows are written; job status and progress are updated until **done** or **failed**.

---

## Deployment notes

### Backend (Render)

- **Build:** e.g. `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start:** `npm start` (runs `node index.js`)
- Set **`CORS_ORIGIN`** to `https://cat-detection-vision-application.vercel.app` (or your real Vercel domain).
- Set **`ROBOFLOW_API_KEY`** (and optional **`ROBOFLOW_WORKFLOW_URL`**).
- SQLite uses `file:./dev.db` in Prisma by default: for durable data on Render, use a **persistent disk** mounted where `dev.db` lives, or migrate the datasource to a managed database and update `schema.prisma` + `DATABASE_URL`.

### Frontend (Vercel)

- **Build:** `npm run build` in `frontend/`
- Set **`NEXT_PUBLIC_API_URL`** to `https://cat-detection-vision-application.onrender.com` (no trailing slash).

---

## Product specification

Detailed requirements (limits, dashboard expectations, evaluation criteria) are in:

- [`docs/INTERNSHIP_ASSIGNMENT.md`](docs/INTERNSHIP_ASSIGNMENT.md)

---

## License

ISC (backend `package.json`). Frontend is private scaffold defaults; adjust as needed for your distribution.
