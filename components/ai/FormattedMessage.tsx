'use client';

import { renderMarkdown } from '@/lib/ai/markdown';

/**
 * Render an AI message as formatted HTML (bold, lists, headings, etc.).
 * The HTML is produced by lib/ai/markdown.ts, which escapes all input before
 * applying a fixed set of formatting transforms — safe to inject.
 */
export default function FormattedMessage({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={`space-y-1.5 break-words [&_p]:leading-relaxed [&_strong]:font-semibold [&_li]:leading-relaxed [&_li]:pl-1 ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
