'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div 
      data-testid="prd-editor-preview"
      className="prose prose-sm dark:prose-invert max-w-none h-full overflow-auto px-6 py-4"
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
