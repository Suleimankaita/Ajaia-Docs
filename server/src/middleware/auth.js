import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Requires a valid `Authorization: Bearer <token>` header.
 * On success, attaches the authenticated user's Mongo document to
 * `req.user` so downstream controllers never re-decode the token.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Not authenticated");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  req.user = user;
  next();
});
