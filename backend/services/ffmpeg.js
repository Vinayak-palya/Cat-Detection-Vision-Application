const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const ffprobe = require('@ffprobe-installer/ffprobe');

ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegStatic);

function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) {
        reject(new Error(`ffprobe failed: ${err.message}`));
        return;
      }
      const duration = meta?.format?.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('Video has no readable duration metadata.'));
        return;
      }
      resolve(duration);
    });
  });
}

function extractFrames(videoPath, outputDir, fps = 1) {
  fs.mkdirSync(outputDir, { recursive: true });
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-vf fps=${fps}`, '-q:v 2'])
      .output(path.join(outputDir, 'frame-%04d.jpg'))
      .on('end', () => resolve(outputDir))
      .on('error', (err) => {
        reject(new Error(`ffmpeg frame extract failed: ${err.message}`));
      })
      .run();
  });
}

module.exports = { getVideoDuration, extractFrames };
