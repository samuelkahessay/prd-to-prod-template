'use client';

import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { BLANK_PRD_TEMPLATE } from '@/lib/prd/blank-template';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface PrdEditorWrapperProps {
  onSubmit: (content: string) => void;
}

export function PrdEditorWrapper({ onSubmit }: PrdEditorWrapperProps) {
  const [content, setContent] = useState(BLANK_PRD_TEMPLATE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTabKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      
      setContent(newContent);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertMarkdown = useCallback((syntax: string, type: 'wrap' | 'prefix' | 'block') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newContent = '';
    let cursorOffset = 0;

    if (type === 'wrap') {
      if (syntax === '[](url)') {
        newContent = 
          content.substring(0, start) + 
          '[' + selectedText + '](url)' + 
          content.substring(end);
        cursorOffset = selectedText ? start + selectedText.length + 3 : start + 1;
      } else {
        newContent = 
          content.substring(0, start) + 
          syntax + selectedText + syntax + 
          content.substring(end);
        cursorOffset = selectedText 
          ? start + syntax.length + selectedText.length + syntax.length
          : start + syntax.length;
      }
    } else if (type === 'prefix') {
      const lines = selectedText || '\n';
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      newContent = 
        content.substring(0, lineStart) + 
        syntax + 
        content.substring(lineStart, start) + 
        lines + 
        content.substring(end);
      cursorOffset = lineStart + syntax.length + (start - lineStart) + lines.length;
    } else if (type === 'block') {
      const beforeBlock = content.substring(0, start);
      const afterBlock = content.substring(end);
      const needsNewlineBefore = beforeBlock && !beforeBlock.endsWith('\n');
      const needsNewlineAfter = afterBlock && !afterBlock.startsWith('\n');
      
      const blockContent = syntax.replace('```\n\n```', 
        (needsNewlineBefore ? '\n' : '') + 
        '```\n' + selectedText + '\n```' + 
        (needsNewlineAfter ? '\n' : '')
      );
      
      newContent = beforeBlock + blockContent + afterBlock;
      cursorOffset = start + (needsNewlineBefore ? 1 : 0) + 4 + selectedText.length;
    }

    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = cursorOffset;
    }, 0);
  }, [content]);

  const handleSubmit = useCallback(() => {
    onSubmit(content);
  }, [content, onSubmit]);

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;

  return (
    <div className="flex flex-col space-y-4">
      <div className="rounded-lg border bg-background">
        <EditorToolbar onInsert={insertMarkdown} />
        
        <div className="h-[600px] overflow-hidden">
          <Tabs defaultValue="split" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-2 w-fit">
              <TabsTrigger value="split">Split</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="split" className="flex-1 m-0 data-[state=active]:flex">
              <div className="flex-1 flex flex-col border-r">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleTabKey}
                  data-testid="prd-editor-textarea"
                  className="flex-1 w-full px-6 py-4 font-mono text-sm resize-none focus:outline-none bg-background"
                  placeholder="Write your PRD in Markdown..."
                />
                <div className="px-6 py-2 text-xs text-muted-foreground border-t">
                  {wordCount} words · {charCount} characters
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <MarkdownPreview content={content} />
              </div>
            </TabsContent>
            
            <TabsContent value="edit" className="flex-1 m-0 data-[state=active]:flex flex-col">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleTabKey}
                data-testid="prd-editor-textarea"
                className="flex-1 w-full px-6 py-4 font-mono text-sm resize-none focus:outline-none bg-background"
                placeholder="Write your PRD in Markdown..."
              />
              <div className="px-6 py-2 text-xs text-muted-foreground border-t">
                {wordCount} words · {charCount} characters
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 m-0 data-[state=active]:block overflow-hidden">
              <MarkdownPreview content={content} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg">
          Submit PRD
        </Button>
      </div>
    </div>
  );
}
