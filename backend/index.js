require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { prisma } = require('./lib/prisma');
const { CORS_ORIGIN, PORT } = require('./config/constants');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const videoRoutes = require('./routes/videos');
const jobRoutes = require('./routes/jobs');

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'catvision-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/videos', videoRoutes);
app.use('/api/jobs', jobRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  if (!process.env.ROBOFLOW_API_KEY) {
    console.warn('[warn] ROBOFLOW_API_KEY is unset — inference jobs will fail until it is set.');
  }
});

async function shutdown(signal) {
  console.log(`\n${signal} received, closing…`);
  server.close(() => {
    prisma
      .$disconnect()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
