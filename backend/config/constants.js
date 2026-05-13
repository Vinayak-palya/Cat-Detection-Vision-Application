/**
 * Central limits and defaults (aligned with internship brief).
 * Override via environment variables where noted.
 */
module.exports = {
  MAX_VIDEO_DURATION_SEC: 60,
  MAX_UPLOAD_BYTES: 50 * 1024 * 1024,
  FRAME_SAMPLE_FPS: 1,
  CAT_CONFIDENCE_THRESHOLD: 0.75,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  PORT: parseInt(process.env.PORT || '4000', 10),
  ROBOFLOW_WORKFLOW_URL:
    process.env.ROBOFLOW_WORKFLOW_URL ||
    'https://serverless.roboflow.com/vinayak-palya-s-workspace/workflows/yolo-world-large-demo',
};
