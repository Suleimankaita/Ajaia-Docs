import mongoose from "mongoose";

// Default TipTap document: a single empty paragraph.
const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled document",
      maxlength: 200,
    },
    // We store the TipTap editor state as JSON (Mixed type) rather than
    // rendered HTML. This is the source of truth for formatting, so bold,
    // headings, lists, etc. survive save/reload exactly as authored.
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: () => EMPTY_DOC,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Owner's document list ("My Documents") is a very common query.
documentSchema.index({ owner: 1, updatedAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
