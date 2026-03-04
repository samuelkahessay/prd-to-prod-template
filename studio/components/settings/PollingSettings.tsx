'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { getSettings, updateSettings, type StudioSettings } from '@/lib/settings/storage';

export function PollingSettings() {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setIsHydrated(true);
  }, []);

  const handlePollingIntervalChange = (values: number[]) => {
    const interval = values[0];
    if (interval) {
      updateSettings({ pollingInterval: interval });
      setSettings(getSettings());
    }
  };

  const handleAdaptivePollingChange = (checked: boolean) => {
    updateSettings({ adaptivePolling: checked });
    setSettings(getSettings());
  };

  if (!isHydrated || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Polling</CardTitle>
          <CardDescription>Loading polling settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const intervalSeconds = Math.floor(settings.pollingInterval / 1000);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polling</CardTitle>
        <CardDescription>Configure how often Studio checks for updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="polling-interval">Polling Interval</Label>
            <span className="text-sm font-medium text-muted-foreground">
              {intervalSeconds}s
            </span>
          </div>
          <Slider
            id="polling-interval"
            min={5000}
            max={60000}
            step={5000}
            value={[settings.pollingInterval]}
            onValueChange={handlePollingIntervalChange}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            How frequently Studio queries the GitHub API for updates (5-60 seconds)
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="adaptive-polling">Adaptive Polling</Label>
            <p className="text-xs text-muted-foreground">
              Automatically slow down polling when API rate limit is low
            </p>
          </div>
          <Switch
            id="adaptive-polling"
            checked={settings.adaptivePolling}
            onCheckedChange={handleAdaptivePollingChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
