const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../middleware/asyncHandler');
const { prisma } = require('../lib/prisma');
const { createVideoAndJobFromUpload } = require('../services/videoService');
const { MAX_UPLOAD_BYTES } = require('../config/constants');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/videos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-()+ ]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

/** Multer errors must reach `next(err)` for the global error handler. */
function uploadSingle(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  };
}

router.post(
  '/upload',
  uploadSingle('video'),
  asyncHandler(async (req, res) => {
    const { video, job } = await createVideoAndJobFromUpload(req.file);
    res.status(201).json({
      video,
      jobId: job.id,
      job,
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const videos = await prisma.video.findMany({
      include: { job: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ data: videos });
  })
);

module.exports = router;
