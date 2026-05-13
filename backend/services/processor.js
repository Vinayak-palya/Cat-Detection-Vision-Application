const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/prisma');
const { extractFrames } = require('./ffmpeg');
const {
  FRAME_SAMPLE_FPS,
  CAT_CONFIDENCE_THRESHOLD,
  ROBOFLOW_WORKFLOW_URL,
} = require('../config/constants');

async function inferCatFromImagePath(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch(ROBOFLOW_WORKFLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.ROBOFLOW_API_KEY,
      inputs: {
        image: { type: 'base64', value: base64Image },
        classes: ['cat'],
      },
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Roboflow returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Roboflow HTTP ${response.status}: ${text.slice(0, 200)}`
    );
  }

  const predictions = data?.outputs?.[0]?.predictions?.predictions || [];
  const catScores = predictions
    .filter((p) => p.class?.toLowerCase() === 'cat')
    .map((p) => Number(p.confidence));

  let conf01 = 0;
  if (catScores.length > 0) {
    const raw = Math.max(...catScores);
    const n = Number(raw);
    if (Number.isFinite(n)) {
      conf01 = n > 1 ? n / 100 : n;
    }
  }

  const label =
    conf01 >= CAT_CONFIDENCE_THRESHOLD ? 'cat_present' : 'cat_not_present';

  return {
    label,
    confidence: parseFloat(conf01.toFixed(3)),
  };
}

/**
 * Extracts ~1 FPS frames, runs vision inference per frame, persists predictions,
 * and updates job / video lifecycle fields.
 */
async function processVideoJob(jobId, videoId, videoPath) {
  const framesDir = path.join(__dirname, '../uploads/frames', jobId);

  try {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date(), progress: 0 },
    });
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'processing' },
    });

    await extractFrames(videoPath, framesDir, FRAME_SAMPLE_FPS);

    const files = fs
      .readdirSync(framesDir)
      .filter((f) => /\.jpe?g$/i.test(f))
      .sort();

    const total = files.length;
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { totalFrames: total },
    });

    if (total === 0) {
      throw new Error('No frames extracted from video (ffmpeg produced no JPEGs).');
    }

    for (let i = 0; i < files.length; i++) {
      const framePath = path.join(framesDir, files[i]);
      const timestampSec = i / FRAME_SAMPLE_FPS;

      const { label, confidence } = await inferCatFromImagePath(framePath);

      await prisma.framePrediction.create({
        data: {
          jobId,
          timestampSec,
          label,
          confidence,
        },
      });

      const progress = Math.round(((i + 1) / total) * 100);
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { progress },
      });
    }

    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: 'done', progress: 100, completedAt: new Date() },
    });
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'done' },
    });
  } catch (err) {
    console.error('processVideoJob error:', err);
    const msg = err?.message || String(err);
    await prisma.processingJob
      .update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMsg: msg,
          completedAt: new Date(),
        },
      })
      .catch(() => {});
    await prisma.video
      .update({
        where: { id: videoId },
        data: { status: 'failed' },
      })
      .catch(() => {});
  } finally {
    try {
      fs.rmSync(framesDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

module.exports = { processVideoJob, inferCatFromImagePath };
