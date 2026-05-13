const fs = require('fs');
const { prisma } = require('../lib/prisma');
const { HttpError } = require('../lib/httpError');
const { getVideoDuration } = require('./ffmpeg');
const { processVideoJob } = require('./processor');
const { MAX_VIDEO_DURATION_SEC } = require('../config/constants');

function unlinkQuiet(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

/**
 * Validates duration, persists Video + ProcessingJob, starts background inference.
 * @param {Express.Multer.File | undefined} file - Multer file from `upload.single('video')`
 */
async function createVideoAndJobFromUpload(file) {
  if (!file?.path) {
    throw new HttpError(
      400,
      'No video file received. Send multipart field name "video".',
      'MISSING_FILE'
    );
  }

  const filePath = file.path;

  let durationSec;
  try {
    durationSec = await getVideoDuration(filePath);
  } catch {
    unlinkQuiet(filePath);
    throw new HttpError(
      400,
      'Could not read this file as a video. Try MP4, MOV, or another common format.',
      'INVALID_VIDEO'
    );
  }

  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    unlinkQuiet(filePath);
    throw new HttpError(400, 'Invalid or zero-length video duration.', 'INVALID_DURATION');
  }

  if (durationSec > MAX_VIDEO_DURATION_SEC) {
    unlinkQuiet(filePath);
    throw new HttpError(
      400,
      `Video must be ${MAX_VIDEO_DURATION_SEC} seconds or less (this file is ${durationSec.toFixed(1)}s).`,
      'VIDEO_TOO_LONG'
    );
  }

  const video = await prisma.video.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      durationSec,
      filePath,
      status: 'pending',
    },
  });

  const job = await prisma.processingJob.create({
    data: { videoId: video.id, status: 'queued' },
  });

  processVideoJob(job.id, video.id, filePath).catch((e) => {
    console.error('[processVideoJob]', e);
  });

  return { video, job };
}

module.exports = { createVideoAndJobFromUpload };
