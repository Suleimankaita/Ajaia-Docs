function ToolbarButton({ onClick, isActive, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive ? "bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor, readOnly }) {
  if (!editor) return null;

  const disabled = readOnly;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 sticky top-[57px] z-10">
      <ToolbarButton
        label="Bold"
        disabled={disabled}
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        disabled={disabled}
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        disabled={disabled}
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton
        label="Heading 1"
        disabled={disabled}
        isActive={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        disabled={disabled}
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton
        label="Bulleted list"
        disabled={disabled}
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        &#8226; List
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        disabled={disabled}
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
    </div>
  );
}
