import { Document } from "../models/Document.js";
import { DocumentShare } from "../models/DocumentShare.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDocumentWithRole,
  assertCanEdit,
  assertCanRename,
  assertIsOwner,
} from "../services/documentAccessService.js";

export const createDocument = asyncHandler(async (req, res) => {
  const title = (req.body?.title || "Untitled document").trim() || "Untitled document";

  const document = await Document.create({
    title,
    owner: req.user._id,
  });

  res.status(201).json({ document: { ...document.toObject(), role: "owner" } });
});

/**
 * Returns documents owned by the current user and documents shared with
 * them, clearly separated into two arrays so the dashboard can render
 * "My Documents" and "Shared With Me" without extra client-side logic.
 */
export const listDocuments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [owned, shares] = await Promise.all([
    Document.find({ owner: userId }).sort({ updatedAt: -1 }),
    DocumentShare.find({ user: userId }).populate({
      path: "document",
      populate: { path: "owner", select: "name email" },
    }),
  ]);

  const ownedResponse = owned.map((doc) => ({
    ...doc.toObject(),
    role: "owner",
  }));

  const sharedResponse = shares
    .filter((share) => share.document) // guard against dangling refs
    .map((share) => ({
      ...share.document.toObject(),
      role: share.permission,
      owner: share.document.owner,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.status(200).json({ owned: ownedResponse, shared: sharedResponse });
});

export const getDocument = asyncHandler(async (req, res) => {
  const { document, role } = await getDocumentWithRole(req.params.id, req.user._id);
  // Reaching this point already proves read access (owner or has a share).
  res.status(200).json({ document: { ...document.toObject(), role } });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const { document, role } = await getDocumentWithRole(req.params.id, req.user._id);
  assertCanEdit(role);

  const { title, content } = req.body;

  if (title !== undefined) {
    const trimmed = title.trim();
    document.title = trimmed.length > 0 ? trimmed : "Untitled document";
  }
  if (content !== undefined) {
    document.content = content;
  }

  await document.save();
  res.status(200).json({ document: { ...document.toObject(), role } });
});

export const renameDocument = asyncHandler(async (req, res) => {
  const { document, role } = await getDocumentWithRole(req.params.id, req.user._id);
  assertCanRename(role);

  const { title } = req.body;
  if (!title || !title.trim()) {
    throw new ApiError(400, "Title cannot be empty");
  }

  document.title = title.trim();
  await document.save();
  res.status(200).json({ document: { ...document.toObject(), role } });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { document, role } = await getDocumentWithRole(req.params.id, req.user._id);
  assertIsOwner(role);

  await Promise.all([
    Document.deleteOne({ _id: document._id }),
    DocumentShare.deleteMany({ document: document._id }),
  ]);

  res.status(200).json({ message: "Document deleted" });
});
