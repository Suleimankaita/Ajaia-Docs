import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  useListDocumentsQuery,
  useCreateDocumentMutation,
  useImportDocumentMutation,
} from "../store/apiSlice.js";
import { loggedOut } from "../store/authSlice.js";
import DocumentCard from "../components/DocumentCard.jsx";
import { getErrorMessage } from "../utils/getErrorMessage.js";

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);

  const { data, isLoading, isError } = useListDocumentsQuery();
  const [createDocument, { isLoading: isCreating }] = useCreateDocumentMutation();
  const [importDocument, { isLoading: isImporting }] = useImportDocumentMutation();

  async function handleNewDocument() {
    const result = await createDocument({ title: "Untitled document" }).unwrap();
    navigate(`/documents/${result.document._id}`);
  }

  function handleUploadClick() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await importDocument(formData).unwrap();
      navigate(`/documents/${result.document._id}`);
    } catch (err) {
      setUploadError(getErrorMessage(err, "Could not import that file"));
    }
  }

  function handleLogout() {
    dispatch(loggedOut());
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Ajaia Docs</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={handleNewDocument}
            disabled={isCreating}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-md px-4 py-2"
          >
            + New Document
          </button>
          <button
            onClick={handleUploadClick}
            disabled={isImporting}
            className="bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-sm font-medium rounded-md px-4 py-2"
          >
            {isImporting ? "Uploading..." : "Upload File"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-xs text-gray-400">Supports .txt and .md files, up to 2MB</span>
        </div>

        {uploadError && (
          <p className="text-sm text-red-600 mb-6" role="alert">
            {uploadError}
          </p>
        )}

        {isLoading && <p className="text-sm text-gray-400">Loading documents...</p>}
        {isError && <p className="text-sm text-red-600">Could not load your documents.</p>}

        {data && (
          <div className="space-y-10">
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                My Documents
              </h2>
              {data.owned.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No documents yet. Create one to get started.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.owned.map((doc) => (
                    <DocumentCard key={doc._id} document={doc} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Shared With Me
              </h2>
              {data.shared.length === 0 ? (
                <p className="text-sm text-gray-400">Nothing has been shared with you yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.shared.map((doc) => (
                    <DocumentCard
                      key={doc._id}
                      document={doc}
                      ownerLabel={doc.owner?.name || doc.owner?.email}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
