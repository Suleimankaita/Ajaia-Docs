import { ApiError } from "../utils/ApiError.js";

/**
 * Single place where every thrown/rejected error in the app ends up.
 * Ensures we never leak stack traces, Mongo internals, or secrets to
 * the client, and that every error response has a consistent shape:
 * { message: string }.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Known, intentional errors we threw ourselves.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Mongoose validation errors -> 400 with the first useful message.
  if (err.name === "ValidationError") {
    const firstMessage = Object.values(err.errors)[0]?.message || "Validation error";
    return res.status(400).json({ message: firstMessage });
  }

  // Duplicate key (e.g. duplicate email, duplicate share) -> 409.
  if (err.code === 11000) {
    return res.status(409).json({ message: "This resource already exists" });
  }

  // Malformed ObjectId in a route param -> treat as 404 rather than 500.
  if (err.name === "CastError") {
    return res.status(404).json({ message: "Resource not found" });
  }

  // Multer file-size errors.
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File exceeds the 2MB size limit" });
  }

  console.error(err);
  return res.status(500).json({ message: "Something went wrong on our end" });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}
