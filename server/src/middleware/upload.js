import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB, per the assignment spec

// Extensions we accept. MIME type is checked too, but browsers are
// inconsistent about what MIME type they report for .md files, so we
// treat the extension as the primary signal and MIME type as a secondary
// sanity check rather than the sole gate.
const ALLOWED_EXTENSIONS = new Set(["txt", "md"]);
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/octet-stream", // some browsers send this for .md
]);

function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const extension = getExtension(file.originalname);

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return cb(new ApiError(400, "Only .txt and .md files are supported"));
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new ApiError(400, "Unsupported file type"));
  }

  cb(null, true);
}

export const uploadDocumentFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single("file");
