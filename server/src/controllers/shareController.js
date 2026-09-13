import { DocumentShare } from "../models/DocumentShare.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDocumentWithRole, assertIsOwner } from "../services/documentAccessService.js";

const VALID_PERMISSIONS = new Set(["viewer", "editor"]);

export const createShare = asyncHandler(async (req, res) => {
  const { document, role } = await getDocumentWithRole(req.params.id, req.user._id);
  assertIsOwner(role);

  const { email, permission } = req.body;

  if (!email || !permission) {
    throw new ApiError(400, "Email and permission are required");
  }
  if (!VALID_PERMISSIONS.has(permission)) {
    throw new ApiError(400, "Permission must be 'viewer' or 'editor'");
  }

  const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (!targetUser) {
    throw new ApiError(404, "No registered user with that email");
  }

  if (targetUser._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot share a document with yourself");
  }

  // If a share already exists, update the permission in a controlled way
  // rather than silently creating a duplicate (the unique index would
  // reject a true duplicate anyway, but this gives a friendlier result).
  const existingShare = await DocumentShare.findOne({
    document: document._id,
    user: targetUser._id,
  });

  if (existingShare) {
    existingShare.permission = permission;
    await existingShare.save();
    return res.status(200).json({ share: existingShare });
  }

  const share = await DocumentShare.create({
    document: document._id,
    user: targetUser._id,
    permission,
  });

  res.status(201).json({ share });
});

export const listShares = asyncHandler(async (req, res) => {
  const { role } = await getDocumentWithRole(req.params.id, req.user._id);
  assertIsOwner(role);

  const shares = await DocumentShare.find({ document: req.params.id }).populate(
    "user",
    "name email"
  );

  res.status(200).json({ shares });
});

export const deleteShare = asyncHandler(async (req, res) => {
  const { role } = await getDocumentWithRole(req.params.id, req.user._id);
  assertIsOwner(role);

  const result = await DocumentShare.deleteOne({
    document: req.params.id,
    user: req.params.userId,
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "Share not found");
  }

  res.status(200).json({ message: "Share removed" });
});
