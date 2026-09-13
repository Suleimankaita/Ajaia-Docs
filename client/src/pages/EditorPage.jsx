import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  useGetDocumentQuery,
  useUpdateDocumentMutation,
  useRenameDocumentMutation,
  useDeleteDocumentMutation,
} from "../store/apiSlice.js";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback.js";
import Toolbar from "../components/Toolbar.jsx";
import ShareModal from "../components/ShareModal.jsx";
import { getErrorMessage } from "../utils/getErrorMessage.js";

const AUTOSAVE_DELAY_MS = 900;

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetDocumentQuery(id);
  const [updateDocument] = useUpdateDocumentMutation();
  const [renameDocument] = useRenameDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();

  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [showShareModal, setShowShareModal] = useState(false);

  const document = data?.document;
  const role = document?.role;
  const canEdit = role === "owner" || role === "editor";
  const isOwner = role === "owner";

  const debouncedSaveContent = useDebouncedCallback(async (content) => {
    setSaveStatus("saving");
    try {
      await updateDocument({ id, content }).unwrap();
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, AUTOSAVE_DELAY_MS);

  const editor = useEditor(
    {
      extensions: [StarterKit, Underline],
      content: document?.content,
      editable: canEdit,
      editorProps: {
        attributes: { class: "tiptap-content" },
      },
      onUpdate: ({ editor: activeEditor }) => {
        debouncedSaveContent(activeEditor.getJSON());
      },
    },
    [document?._id] // recreate the editor when we navigate to a different document
  );

  // Keep the local title input and the editor's editable state in sync
  // once the document has loaded (useEditor's deps array only handles
  // document identity, not later updates to editable/content).
  useEffect(() => {
    if (document) {
      setTitle(document.title);
    }
  }, [document?._id, document?.title]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  const commitTitle = useCallback(async () => {
    if (!document || title.trim() === document.title || !canEdit) return;
    try {
      await renameDocument({ id, title }).unwrap();
    } catch {
      setTitle(document.title); // revert on failure
    }
  }, [document, title, canEdit, id, renameDocument]);

  async function handleDelete() {
    if (!window.confirm("Delete this document permanently? This cannot be undone.")) return;
    await deleteDocument(id).unwrap();
    navigate("/");
  }

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-400">Loading document...</div>;
  }

  if (isError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600 mb-4">
          {getErrorMessage(error, "This document could not be found or you don't have access to it.")}
        </p>
        <button onClick={() => navigate("/")} className="text-sm text-brand-600 hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-500 hover:text-gray-800 shrink-0"
          >
            &larr; Dashboard
          </button>

          <input
            value={title}
            disabled={!canEdit}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            className="flex-1 min-w-0 text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 disabled:text-gray-500 truncate"
          />

          <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && (
              <span className="text-red-500">Save failed</span>
            )}
          </span>

          {isOwner && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 shrink-0"
              >
                Share
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm font-medium text-red-500 hover:text-red-700 shrink-0"
              >
                Delete
              </button>
            </>
          )}
        </div>
        <Toolbar editor={editor} readOnly={!canEdit} />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {!canEdit && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
            You have view-only access to this document.
          </p>
        )}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-8">
          <EditorContent editor={editor} />
        </div>
      </main>

      {showShareModal && (
        <ShareModal documentId={id} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}
