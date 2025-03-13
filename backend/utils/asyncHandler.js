/**
 * Wraps async controller functions to eliminate try-catch boilerplate
 * @param {Function} fn - The async controller function
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;