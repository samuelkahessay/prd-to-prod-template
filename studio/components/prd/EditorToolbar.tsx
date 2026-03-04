'use client';

import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Heading2, 
  List, 
  Code, 
  Link as LinkIcon 
} from 'lucide-react';

export interface EditorToolbarProps {
  onInsert: (syntax: string, type: 'wrap' | 'prefix' | 'block') => void;
}

export function EditorToolbar({ onInsert }: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onInsert('**', 'wrap')}
        data-testid="toolbar-bold"
        title="Bold"
      >
        <Bold />
      </Button>
      
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onInsert('*', 'wrap')}
        data-testid="toolbar-italic"
        title="Italic"
      >
        <Italic />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onInsert('## ', 'prefix')}
        data-testid="toolbar-heading"
        title="Heading"
      >
        <Heading2 />
      </Button>
      
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onInsert('- ', 'prefix')}
        data-testid="toolbar-list"
        title="List"
      >
        <List />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onInsert('```\n\n```', 'block')}
        data-testid="toolbar-code"
        title="Code Block"
      >
        <Code />
      </Button>
      
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onInsert('[](url)', 'wrap')}
        data-testid="toolbar-link"
        title="Link"
      >
        <LinkIcon />
      </Button>
    </div>
  );
}
