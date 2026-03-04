"use client";

import ReactMarkdown from "react-markdown";

interface PrdPreviewProps {
  markdown: string;
}

export function PrdPreview({ markdown }: PrdPreviewProps) {
  return (
    <div
      data-testid="prd-preview"
      className="prose prose-sm dark:prose-invert max-w-none overflow-auto p-4"
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
