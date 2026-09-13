import { useState } from "react";
import {
  useListSharesQuery,
  useCreateShareMutation,
  useDeleteShareMutation,
} from "../store/apiSlice.js";
import { getErrorMessage } from "../utils/getErrorMessage.js";

export default function ShareModal({ documentId, onClose }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");

  const { data, isLoading: isLoadingShares } = useListSharesQuery(documentId);
  const [createShare, { isLoading: isSharing, error: shareError }] = useCreateShareMutation();
  const [deleteShare] = useDeleteShareMutation();

  async function handleShare(e) {
    e.preventDefault();
    try {
      await createShare({ documentId, email, permission }).unwrap();
      setEmail("");
      setPermission("viewer");
    } catch {
      // surfaced via shareError below
    }
  }

  async function handleRemove(userId) {
    await deleteShare({ documentId, userId });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Share document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleShare} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="email"
            required
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button
            type="submit"
            disabled={isSharing}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-md px-4 py-2"
          >
            Share
          </button>
        </form>

        {shareError && (
          <p className="text-sm text-red-600 mb-4">{getErrorMessage(shareError, "Could not share document")}</p>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">People with access</h3>
          {isLoadingShares && <p className="text-sm text-gray-400">Loading...</p>}
          {!isLoadingShares && data?.shares?.length === 0 && (
            <p className="text-sm text-gray-400">Not shared with anyone yet.</p>
          )}
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {data?.shares?.map((share) => (
              <li
                key={share._id}
                className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2"
              >
                <div>
                  <p className="text-gray-800">{share.user?.name}</p>
                  <p className="text-gray-400 text-xs">{share.user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 capitalize">{share.permission}</span>
                  <button
                    onClick={() => handleRemove(share.user?._id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
