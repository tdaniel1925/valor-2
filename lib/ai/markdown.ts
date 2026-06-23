/**
 * Tiny, dependency-free markdown → safe HTML renderer for AI chat responses.
 *
 * The model emits light markdown (bold, italic, code, headings, bullet/numbered
 * lists, line breaks). We escape ALL HTML first, then apply a controlled set of
 * formatting transforms — so model output can never inject markup (no XSS).
 * This is intentionally minimal: it is NOT a full CommonMark parser.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Inline formatting applied to already-escaped text. */
function inline(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
}

/**
 * Render a markdown string to a safe HTML string.
 * Block-level: # headings, - / * bullets, 1. ordered lists, blank-line paragraphs.
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';
  const lines = escapeHtml(md.replace(/\r\n/g, '\n')).split('\n');

  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const size = level === 1 ? 'text-base font-bold' : level === 2 ? 'text-sm font-bold' : 'text-sm font-semibold';
      html.push(`<p class="${size} mt-2 first:mt-0">${inline(heading[2])}</p>`);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul class="list-disc list-inside space-y-0.5">');
        listType = 'ul';
      }
      html.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol class="list-decimal list-inside space-y-0.5">');
        listType = 'ol';
      }
      html.push(`<li>${inline(ordered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }
  closeList();

  return html.join('');
}
