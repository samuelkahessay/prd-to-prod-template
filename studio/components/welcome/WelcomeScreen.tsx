import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShowcaseList } from '@/components/welcome/ShowcaseList';
import type { ShowcaseEntry } from '@/lib/pipeline/types';

interface WelcomeScreenProps {
  showcaseEntries: ShowcaseEntry[];
  owner: string;
  repo: string;
}

export function WelcomeScreen({ showcaseEntries, owner, repo }: WelcomeScreenProps) {
  return (
    <div data-testid="welcome-screen" className="space-y-8 py-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-6 text-primary" />
            <CardTitle className="text-3xl font-bold">
              Welcome to prd-to-prod Studio
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            Turn product requirements into deployed software, autonomously. Drop a PRD
            and watch AI agents decompose, implement, review, and deploy your vision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/prd/new">
            <Button data-testid="welcome-cta" size="lg" className="gap-2">
              Create a PRD
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                1
              </span>
              <div className="pt-1">
                <p className="font-medium">Connect your repo</p>
                <p className="text-sm text-muted-foreground">
                  Authenticate with GitHub to access your pipeline repository
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                2
              </span>
              <div className="pt-1">
                <p className="font-medium">Create a PRD</p>
                <p className="text-sm text-muted-foreground">
                  Write your product requirements and let the decomposer create issues
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                3
              </span>
              <div className="pt-1">
                <p className="font-medium">Watch the magic</p>
                <p className="text-sm text-muted-foreground">
                  Track progress as AI agents implement, review, and deploy your features
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Runs</CardTitle>
          <CardDescription>
            Browse previous pipeline runs archived in your showcase directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShowcaseList entries={showcaseEntries} owner={owner} repo={repo} />
        </CardContent>
      </Card>
    </div>
  );
}
