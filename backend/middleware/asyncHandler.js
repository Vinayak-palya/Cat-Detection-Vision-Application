/**
 * Wraps an async Express route so rejections flow to `next(err)`.
 * @param {(req: import('express').Request, res: import('express').Response) => Promise<void>} fn
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
