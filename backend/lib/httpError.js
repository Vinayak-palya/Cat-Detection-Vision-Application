class HttpError extends Error {
  /**
   * @param {number} statusCode - HTTP status (4xx / 5xx)
   * @param {string} message - User-safe message
   * @param {string} [code='ERROR'] - Stable machine-readable code for clients
   */
  constructor(statusCode, message, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'HttpError';
  }
}

module.exports = { HttpError };
