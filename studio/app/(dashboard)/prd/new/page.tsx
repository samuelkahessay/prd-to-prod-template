'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PrdWizard } from '@/components/prd/PrdWizard';
import { PrdEditorWrapper } from '@/components/prd/PrdEditorWrapper';
import { SubmitDialog } from '@/components/prd/SubmitDialog';
import { RepoPicker } from '@/components/repo/RepoPicker';
import { useRepo } from '@/lib/repo/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Wand2, Code2 } from 'lucide-react';

type Mode = 'template' | 'advanced';

export default function NewPrdPage() {
  const router = useRouter();
  const { currentRepo } = useRepo();
  const [mode, setMode] = useState<Mode>('template');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [prdContent, setPrdContent] = useState('');
  const [prdTitle, setPrdTitle] = useState('');

  const extractTitleFromMarkdown = useCallback((markdown: string): string => {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'New PRD';
  }, []);

  const preparePrdSubmission = useCallback((markdown: string) => {
    const title = extractTitleFromMarkdown(markdown);
    setPrdContent(markdown);
    setPrdTitle(title);
    
    if (!currentRepo) {
      alert('Please select a repository before submitting');
      return;
    }
    
    setSubmitDialogOpen(true);
  }, [currentRepo, extractTitleFromMarkdown]);

  const handleWizardComplete = useCallback((markdown: string) => {
    preparePrdSubmission(markdown);
  }, [preparePrdSubmission]);

  const handleEditorSubmit = useCallback((markdown: string) => {
    preparePrdSubmission(markdown);
  }, [preparePrdSubmission]);

  const handleDialogClose = useCallback((open: boolean) => {
    setSubmitDialogOpen(open);
    if (!open) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <AuthGuard>
      <div className="page-fade-in flex min-h-screen flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-[280px]">
                  <RepoPicker />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 py-8">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Create a PRD</h1>
              <p className="text-muted-foreground">
                Choose a template or write from scratch. Your PRD will be committed to the repository and automatically decomposed into tasks.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>PRD Builder</CardTitle>
                    <CardDescription>
                      Select a mode to get started with your product requirements document
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                    <TabsTrigger value="template" className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      Template Wizard
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2">
                      <Code2 className="h-4 w-4" />
                      Advanced Editor
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="template" className="mt-0">
                    <div className="rounded-lg border bg-muted/30 p-4 mb-6">
                      <p className="text-sm text-muted-foreground">
                        The template wizard guides you through creating a PRD by selecting a category
                        and filling in a structured form. Perfect for standard project types.
                      </p>
                    </div>
                    <PrdWizard onComplete={handleWizardComplete} />
                  </TabsContent>

                  <TabsContent value="advanced" className="mt-0">
                    <div className="rounded-lg border bg-muted/30 p-4 mb-6">
                      <p className="text-sm text-muted-foreground">
                        The advanced editor provides a Markdown editor with live preview and
                        formatting tools. Use this for custom PRD structures or complex requirements.
                      </p>
                    </div>
                    <PrdEditorWrapper onSubmit={handleEditorSubmit} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {currentRepo && (
          <SubmitDialog
            open={submitDialogOpen}
            onOpenChange={handleDialogClose}
            title={prdTitle}
            content={prdContent}
            owner={currentRepo.owner}
            repo={currentRepo.repo}
          />
        )}
      </div>
    </AuthGuard>
  );
}
