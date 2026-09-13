import mongoose from "mongoose";

const documentShareSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permission: {
      type: String,
      enum: ["viewer", "editor"],
      required: true,
    },
  },
  { timestamps: true }
);

// A single user can only have one share record per document.
// This both prevents duplicates at the DB level and makes "does X have
// access to Y" a fast indexed lookup.
documentShareSchema.index({ document: 1, user: 1 }, { unique: true });

// "Shared With Me" queries by user across all documents.
documentShareSchema.index({ user: 1 });

export const DocumentShare = mongoose.model("DocumentShare", documentShareSchema);
