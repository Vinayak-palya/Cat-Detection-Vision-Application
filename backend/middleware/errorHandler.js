const multer = require('multer');
const { Prisma } = require('@prisma/client');
const { HttpError } = require('../lib/httpError');

function formatError(err, req) {
  if (err instanceof HttpError) {
    return {
      status: err.statusCode,
      body: { error: { message: err.message, code: err.code } },
    };
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return {
        status: 400,
        body: {
          error: {
            message: 'File exceeds the maximum allowed size (50 MB).',
            code: 'FILE_TOO_LARGE',
          },
        },
      };
    }
    return {
      status: 400,
      body: { error: { message: err.message, code: 'UPLOAD_ERROR' } },
    };
  }

  // Multer fileFilter and other string errors
  if (err?.message === 'Only video files are allowed') {
    return {
      status: 400,
      body: {
        error: { message: err.message, code: 'INVALID_FILE_TYPE' },
      },
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const dev = process.env.NODE_ENV !== 'production';
    return {
      status: 400,
      body: {
        error: {
          message: 'Database request could not be completed.',
          code: 'DATABASE_ERROR',
          ...(dev && { details: err.message }),
        },
      },
    };
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      body: {
        error: {
          message: 'Invalid data supplied to the database layer.',
          code: 'VALIDATION_ERROR',
        },
      },
    };
  }

  console.error('[unhandled]', err);
  return {
    status: 500,
    body: {
      error: {
        message: 'Something went wrong. Please try again later.',
        code: 'INTERNAL_ERROR',
      },
    },
  };
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  const { status, body } = formatError(err, req);
  res.status(status).json(body);
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: `No route for ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
