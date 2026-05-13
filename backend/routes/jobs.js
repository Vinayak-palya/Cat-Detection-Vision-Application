const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { prisma } = require('../lib/prisma');
const { HttpError } = require('../lib/httpError');

const router = express.Router();

router.get(
  '/:jobId/status',
  asyncHandler(async (req, res) => {
    const job = await prisma.processingJob.findUnique({
      where: { id: req.params.jobId },
      include: { video: true },
    });
    if (!job) {
      throw new HttpError(404, 'Processing job not found.', 'JOB_NOT_FOUND');
    }
    res.json(job);
  })
);

router.get(
  '/:jobId/results',
  asyncHandler(async (req, res) => {
    const jobExists = await prisma.processingJob.findUnique({
      where: { id: req.params.jobId },
      select: { id: true },
    });
    if (!jobExists) {
      throw new HttpError(404, 'Processing job not found.', 'JOB_NOT_FOUND');
    }

    const frames = await prisma.framePrediction.findMany({
      where: { jobId: req.params.jobId },
      orderBy: { timestampSec: 'asc' },
    });
    res.json({ data: frames });
  })
);

module.exports = router;
