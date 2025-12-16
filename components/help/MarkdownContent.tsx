"use client";

import React from "react";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Basic Markdown renderer for help articles
 * Handles: headings, bold, italic, links, lists, code blocks, and images
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  // Parse markdown to HTML (simplified version)
  const parseMarkdown = (text: string): string => {
    let html = text;

    // Code blocks (```code```)
    html = html.replace(/```([^`]+)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>');

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h1>');

    // Bold (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // Italic (*text*)
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // Links ([text](url))
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Images (![alt](url))
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />');

    // Unordered lists (- item)
    html = html.replace(/^- (.*)$/gm, '<li class="ml-4 mb-2">$1</li>');
    html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-4 space-y-2">$&</ul>');

    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.*)$/gm, '<li class="ml-4 mb-2">$1</li>');

    // Blockquotes (> text)
    html = html.replace(/^> (.*)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300">$1</blockquote>');

    // Horizontal rules (---)
    html = html.replace(/^---$/gm, '<hr class="my-8 border-gray-300 dark:border-gray-700" />');

    // Paragraphs (double line breaks)
    html = html.replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">');
    html = '<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">' + html + '</p>';

    return html;
  };

  const htmlContent = parseMarkdown(content);

  return (
    <div
      className={`prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
