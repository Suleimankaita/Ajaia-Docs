import { Document } from "../models/Document.js";
import { DocumentShare } from "../models/DocumentShare.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Every route that touches a document goes through this module rather
 * than re-implementing "is this user allowed to do X" inline. This is
 * the single reusable authorization helper the assignment asks for.
 *
 * Roles, from most to least privileged:
 *   owner  - read, edit, rename, delete, share, remove shares
 *   editor - read, edit, rename
 *   viewer - read only
 */

/**
 * Loads a document and figures out the current user's effective role on
 * it. Throws 404 if the document doesn't exist, or if the user has no
 * relationship to it at all (we deliberately return 404 rather than 403
 * for "no access" so we don't reveal that a document exists).
 */
export async function getDocumentWithRole(documentId, userId) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (document.owner.toString() === userId.toString()) {
    return { document, role: "owner" };
  }

  const share = await DocumentShare.findOne({ document: documentId, user: userId });
  if (!share) {
    throw new ApiError(404, "Document not found");
  }

  return { document, role: share.permission }; // "viewer" | "editor"
}

export function assertCanRead(role) {
  // owner, editor, and viewer can all read - reaching this point via
  // getDocumentWithRole already guarantees read access, this exists for
  // readability at call sites.
  if (!["owner", "editor", "viewer"].includes(role)) {
    throw new ApiError(403, "You do not have access to this document");
  }
}

export function assertCanEdit(role) {
  if (role !== "owner" && role !== "editor") {
    throw new ApiError(403, "You do not have permission to edit this document");
  }
}

export function assertCanRename(role) {
  if (role !== "owner" && role !== "editor") {
    throw new ApiError(403, "You do not have permission to rename this document");
  }
}

export function assertIsOwner(role) {
  if (role !== "owner") {
    throw new ApiError(403, "Only the document owner can perform this action");
  }
}
