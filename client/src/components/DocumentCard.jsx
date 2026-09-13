import { useNavigate } from "react-router-dom";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const roleBadgeStyles = {
  owner: "bg-gray-100 text-gray-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-amber-100 text-amber-700",
};

export default function DocumentCard({ document, ownerLabel }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/documents/${document._id}`)}
      className="text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-brand-400 hover:shadow-sm transition-all w-full"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-900 truncate">{document.title}</h3>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeStyles[document.role]}`}
        >
          {document.role}
        </span>
      </div>
      <p className="text-xs text-gray-500">Updated {formatDate(document.updatedAt)}</p>
      {ownerLabel && <p className="text-xs text-gray-400 mt-1">Owned by {ownerLabel}</p>}
    </button>
  );
}
