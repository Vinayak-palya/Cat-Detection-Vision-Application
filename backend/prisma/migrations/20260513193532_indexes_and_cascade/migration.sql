-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FramePrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "timestampSec" REAL NOT NULL,
    "label" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0,
    "framePath" TEXT,
    CONSTRAINT "FramePrediction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FramePrediction" ("confidence", "framePath", "id", "jobId", "label", "timestampSec") SELECT "confidence", "framePath", "id", "jobId", "label", "timestampSec" FROM "FramePrediction";
DROP TABLE "FramePrediction";
ALTER TABLE "new_FramePrediction" RENAME TO "FramePrediction";
CREATE INDEX "FramePrediction_jobId_idx" ON "FramePrediction"("jobId");
CREATE TABLE "new_ProcessingJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalFrames" INTEGER NOT NULL DEFAULT 0,
    "errorMsg" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "ProcessingJob_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProcessingJob" ("completedAt", "errorMsg", "id", "progress", "startedAt", "status", "totalFrames", "videoId") SELECT "completedAt", "errorMsg", "id", "progress", "startedAt", "status", "totalFrames", "videoId" FROM "ProcessingJob";
DROP TABLE "ProcessingJob";
ALTER TABLE "new_ProcessingJob" RENAME TO "ProcessingJob";
CREATE UNIQUE INDEX "ProcessingJob_videoId_key" ON "ProcessingJob"("videoId");
CREATE INDEX "ProcessingJob_status_idx" ON "ProcessingJob"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- CreateIndex
CREATE INDEX "Video_uploadedAt_idx" ON "Video"("uploadedAt");
