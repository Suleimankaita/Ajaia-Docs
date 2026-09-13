import { Document } from "../models/Document.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  txtToTiptapDoc,
  markdownToTiptapDoc,
  deriveTitleFromMarkdown,
} from "../utils/fileToTiptap.js";

function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function stripExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? filename : filename.slice(0, idx);
}

export const importDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file was uploaded");
  }

  const extension = getExtension(req.file.originalname);
  const rawText = req.file.buffer.toString("utf-8");
  const fallbackTitle = stripExtension(req.file.originalname) || "Untitled document";

  let content;
  let title;

  if (extension === "md") {
    content = markdownToTiptapDoc(rawText);
    title = deriveTitleFromMarkdown(rawText, fallbackTitle);
  } else if (extension === "txt") {
    content = txtToTiptapDoc(rawText);
    title = fallbackTitle;
  } else {
    // The multer fileFilter should already prevent this, but stay defensive.
    throw new ApiError(400, "Only .txt and .md files are supported");
  }

  const document = await Document.create({
    title,
    content,
    owner: req.user._id,
  });

  res.status(201).json({ document: { ...document.toObject(), role: "owner" } });
});
