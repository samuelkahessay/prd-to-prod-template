'use client';

import Link from 'next/link';
import { AuthSettings } from '@/components/settings/AuthSettings';
import { PollingSettings } from '@/components/settings/PollingSettings';
import { RepoPicker } from '@/components/repo/RepoPicker';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="page-fade-in container mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure Studio authentication, repository, and polling preferences
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <AuthSettings />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Connected Repository</CardTitle>
              <CardDescription>
                Select the prd-to-prod repository you want to monitor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RepoPicker />
            </CardContent>
          </Card>
        </section>

        <section className="xl:col-span-2">
          <PollingSettings />
        </section>

        <section className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>prd-to-prod Studio information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="font-mono text-sm">0.1.0</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <a
                  href="https://github.com/your-org/prd-to-prod-template"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  GitHub Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="/docs/ARCHITECTURE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  Architecture Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
