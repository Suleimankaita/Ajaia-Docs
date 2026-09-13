/**
 * RTK Query error shapes vary (fetch error, server error body, etc).
 * This normalizes them into a single user-friendly string so every
 * page doesn't need to re-implement the same defensive checks.
 */
export function getErrorMessage(error, fallback = "Something went wrong") {
  if (!error) return null;
  if (error.data?.message) return error.data.message;
  if (error.error) return error.error;
  return fallback;
}
