import { ExternalLink, Calendar, Tag } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ShowcaseEntry } from '@/lib/pipeline/types';

interface ShowcaseListProps {
  entries: ShowcaseEntry[];
  owner: string;
  repo: string;
}

export function ShowcaseList({ entries, owner, repo }: ShowcaseListProps) {
  if (entries.length === 0) {
    return (
      <div data-testid="showcase-list" className="text-center py-8">
        <p className="text-sm text-muted-foreground">No completed runs yet</p>
      </div>
    );
  }

  return (
    <div data-testid="showcase-list" className="grid gap-4 md:grid-cols-2">
      {entries.map((entry) => (
        <Card key={entry.slug} data-testid="showcase-entry">
          <CardHeader>
            <CardTitle className="text-lg">{entry.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <Tag className="size-3" />
              <a
                href={`https://github.com/${owner}/${repo}/releases/tag/${entry.tag}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {entry.tag}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              <span>{entry.date}</span>
            </div>
            {(entry.issueCount || entry.prCount) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {entry.issueCount && <span>{entry.issueCount} issues</span>}
                {entry.prCount && <span>{entry.prCount} PRs</span>}
              </div>
            )}
            {entry.deploymentUrl && (
              <a
                href={entry.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                {entry.deploymentUrl.replace(/^https?:\/\//, '')}
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
