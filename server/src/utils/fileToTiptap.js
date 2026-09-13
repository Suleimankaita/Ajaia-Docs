/**
 * Converts uploaded TXT/Markdown file text into a TipTap-compatible JSON
 * document. This is intentionally a small, dependency-free converter -
 * the assignment explicitly says a full Markdown publishing engine is
 * unnecessary, so we cover the common cases (headings, bold, italic,
 * bullet/numbered lists, paragraphs) rather than the whole spec.
 */

function textRunToInlineNodes(text) {
  // Handles **bold** and *italic* inline within a single line.
  // Kept intentionally simple: it does not handle nested/overlapping
  // marks, which is an acceptable trade-off for a take-home import feature.
  const nodes = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      nodes.push({ type: "text", marks: [{ type: "bold" }], text: match[2] });
    } else if (match[3] !== undefined) {
      nodes.push({ type: "text", marks: [{ type: "italic" }], text: match[3] });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  if (nodes.length === 0) {
    return [];
  }

  return nodes;
}

function paragraphNode(text) {
  const content = textRunToInlineNodes(text);
  return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
}

function headingNode(level, text) {
  const content = textRunToInlineNodes(text);
  return {
    type: "heading",
    attrs: { level },
    content: content.length > 0 ? content : undefined,
  };
}

function listItemNode(text) {
  return { type: "listItem", content: [paragraphNode(text)] };
}

/**
 * Plain TXT import: each non-empty line becomes its own paragraph, so the
 * document opens as regular editable text, matching the assignment's
 * "import as document paragraphs/content" requirement.
 */
export function txtToTiptapDoc(rawText) {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const content = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => paragraphNode(line.trim()));

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

/**
 * Basic Markdown -> TipTap conversion covering the formatting the editor
 * itself supports: H1/H2 headings, bullet and numbered lists, bold/italic,
 * and paragraphs. Anything more exotic (tables, code fences, images) is
 * intentionally out of scope per the assignment brief.
 */
export function markdownToTiptapDoc(rawMarkdown) {
  const lines = rawMarkdown.replace(/\r\n/g, "\n").split("\n");
  const content = [];

  let currentList = null; // { type: "bulletList" | "orderedList", items: [] }

  const flushList = () => {
    if (currentList) {
      content.push({
        type: currentList.type,
        content: currentList.items,
      });
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushList();
      continue;
    }

    const h1 = /^#\s+(.*)/.exec(line);
    const h2 = /^##\s+(.*)/.exec(line);
    const bullet = /^[-*]\s+(.*)/.exec(line);
    const numbered = /^\d+\.\s+(.*)/.exec(line);

    if (h1) {
      flushList();
      content.push(headingNode(1, h1[1]));
    } else if (h2) {
      flushList();
      content.push(headingNode(2, h2[1]));
    } else if (bullet) {
      if (!currentList || currentList.type !== "bulletList") {
        flushList();
        currentList = { type: "bulletList", items: [] };
      }
      currentList.items.push(listItemNode(bullet[1]));
    } else if (numbered) {
      if (!currentList || currentList.type !== "orderedList") {
        flushList();
        currentList = { type: "orderedList", items: [] };
      }
      currentList.items.push(listItemNode(numbered[1]));
    } else {
      flushList();
      content.push(paragraphNode(line));
    }
  }

  flushList();

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

/**
 * Derives a sensible document title from a Markdown file: the first H1 if
 * present, otherwise falls back to the filename (without extension).
 */
export function deriveTitleFromMarkdown(rawMarkdown, fallbackTitle) {
  const lines = rawMarkdown.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const h1 = /^#\s+(.*)/.exec(line.trim());
    if (h1 && h1[1].trim().length > 0) {
      return h1[1].trim();
    }
  }
  return fallbackTitle;
}
