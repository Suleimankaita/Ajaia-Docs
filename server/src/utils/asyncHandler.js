/**
 * Wraps an async Express route handler so any rejected promise is passed
 * to next(err) automatically, instead of requiring a try/catch in every
 * single controller function.
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
