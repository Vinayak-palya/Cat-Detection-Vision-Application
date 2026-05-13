# Aristar AI Labs — Internship Assignment

**Title:** Video Analysis Dashboard  
**Goal:** Build a small end-to-end platform: upload a video → backend processes it with a vision stack → user sees timestamp-level results in a dashboard. Evaluates frontend, APIs, persistence, storage, and vision integration.

---

## 1. Product overview

| Area | What to deliver |
|------|------------------|
| **User flow** | Upload video → see progress → see job status → inspect per-frame predictions with timestamps |
| **Stack (flexible)** | Web dashboard + backend + SQL DB + file storage + pretrained vision API or model |
| **Out of scope** | Training a custom model |

---

## 2. Functional requirements

### 2.1 Video upload

**User capabilities**

- [ ] Upload a video from the web dashboard  
- [ ] See upload / progress status  
- [ ] View a list of previously uploaded videos  

**Constraints**

| Constraint | Value |
|------------|--------|
| Max duration | **60 seconds** |
| Max file size | **50 MB** |
| Storage | **Persistent** — local disk or cloud object storage |

---

### 2.2 Video processing pipeline

**Trigger:** Processing starts after a successful upload (or explicitly queued; async is a bonus).

**Sampling**

- [ ] Sample approximately **1 frame per second** from the video.

**Per-frame classification**

Each sampled frame must be classified into one of:

- `cat_present`
- `cat_not_present`

**Persistence**

- [ ] Store **frame-level** predictions in a **SQL** database (one row per frame or equivalent).

**Allowed vision approaches (examples)**

- YOLO  
- OpenCV (preprocessing / heuristics, if justified)  
- Roboflow  
- Google Vision API  
- Any other **pretrained** model or hosted API  

**Not required:** custom training.

---

### 2.3 Dashboard

The dashboard should surface:

- [ ] List of **uploaded videos**  
- [ ] **Processing status** per video / job (e.g. queued, processing, done, failed)  
- [ ] **Video preview** (playback of the stored asset)  
- [ ] **Frame-level analysis** — align results with the timeline of the video  
- [ ] **Timestamps** + **prediction labels** per frame  
- [ ] **Confidence scores** (when the model/API provides them)  

---

### 2.4 Backend APIs

Provide HTTP APIs (shape is up to you) that cover at minimum:

| Capability | Typical operations |
|------------|-------------------|
| Upload | Accept multipart video, validate constraints, persist file, create DB records |
| Status | Poll or fetch **processing / job status** (and progress if async) |
| Results | Return **frame-level predictions** (timestamps, labels, confidence) |
| Catalog | **List uploaded videos** (metadata + link to job status) |

You may add webhooks, SSE, or GraphQL if you document the choice; REST is fine.

---

### 2.5 Database

- **Type:** SQL — **PostgreSQL** preferred; **SQLite** acceptable.  
- **Suggested entities** (names flexible):

  1. **Videos** — file metadata, storage path/URL, duration, upload time, overall status  
  2. **Processing jobs** — link to video, job state, progress, errors, timestamps  
  3. **Frame predictions** — link to job, timestamp (seconds), label, optional confidence, optional frame artifact path  

Normalize so one video → one job (or versioned jobs) → many frame rows.

---

## 3. Technical requirements

### 3.1 Frontend

| Preference | Options |
|-------------|---------|
| Preferred | **React** + **Next.js** |
| Alternative | Other React setups if documented |

Focus: clear upload UX, status feedback, readable results view.

---

### 3.2 Backend

| Preference | Options |
|-------------|---------|
| Preferred | **FastAPI** |
| Acceptable | **Express.js** (Node) |

Focus: validation, error responses, separation of upload / queue / inference / persistence.

---

### 3.3 Database

- PostgreSQL (preferred) or SQLite  
- Migrations or schema-as-code encouraged  

---

### 3.4 Deployment (optional, bonus)

- Examples: **Render**, **Railway**, **Vercel** (frontend), **GCP / AWS / Azure**  
- Document env vars, build commands, and where files are stored in production  

---

## 4. Suggested engineering breakdown

Use this as a work plan; order can vary.

1. **Schema & migrations** — Video, Job, FramePrediction tables  
2. **Upload API + storage** — Multer/disk or S3/GCS; enforce 60s / 50MB  
3. **FFmpeg or equivalent** — Extract ~1 FPS frames to temp or memory  
4. **Inference adapter** — Single function: image → `{ label, confidence? }`  
5. **Job runner** — Sync loop or background worker; update job + insert frames  
6. **Read APIs** — List videos, get job status, get frames  
7. **Dashboard** — Upload zone, list, detail/results view with video + timeline/table  
8. **Errors** — Failed jobs, invalid files, API timeouts surfaced in UI and logs  
9. **Docs** — README: setup, env vars, how to run DB + backend + frontend  
10. **Deploy (bonus)** — One-click or clear steps  

---

## 5. Evaluation criteria

Reviewers will assess:

- Code quality and project structure  
- API design (consistency, validation, errors)  
- Database modeling and queries  
- Storage handling (paths, security, cleanup)  
- Frontend usability and feedback during upload/processing  
- Error handling and edge cases  
- Engineering decisions (why SQLite vs Postgres, sync vs async, etc.)  
- **End-to-end completeness** — a real video can run through the full path  

---

## 6. Bonus points

- Async / **background** processing (queue, worker, or non-blocking job pattern)  
- **Polished UI/UX** (loading states, empty states, failure messages)  
- **Deployment** with a short runbook  
- **Documentation** (architecture diagram, API table, env template)  
- **Efficient processing** (batching, rate limits, avoiding redundant work)  

---

## 7. Submission checklist (candidate-facing)

Before submitting, verify:

- [ ] Upload works within **60s** and **50 MB** limits (reject gracefully otherwise)  
- [ ] Videos **persist** after refresh  
- [ ] **~1 FPS** sampling is implemented and documented  
- [ ] Labels are **`cat_present` / `cat_not_present`** in stored data  
- [ ] Dashboard shows **status**, **preview**, **timestamps**, **labels**, **confidence** when available  
- [ ] All required **APIs** exist and are described  
- [ ] **SQL** schema matches the suggested entities (or equivalent, explained)  
- [ ] README explains how to install, configure, and run the stack  

---

*Document structured from the original Aristar AI Labs internship brief.*
