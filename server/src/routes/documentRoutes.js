import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { uploadDocumentFile } from "../middleware/upload.js";
import {
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  renameDocument,
  deleteDocument,
} from "../controllers/documentController.js";
import { createShare, listShares, deleteShare } from "../controllers/shareController.js";
import { importDocument } from "../controllers/uploadController.js";

const router = Router();

// Every document route requires authentication.
router.use(requireAuth);

router.post("/", createDocument);
router.get("/", listDocuments);
router.post("/import", uploadDocumentFile, importDocument);

router.get("/:id", getDocument);
router.patch("/:id", updateDocument);
router.patch("/:id/title", renameDocument);
router.delete("/:id", deleteDocument);

router.post("/:id/shares", createShare);
router.get("/:id/shares", listShares);
router.delete("/:id/shares/:userId", deleteShare);

export default router;
