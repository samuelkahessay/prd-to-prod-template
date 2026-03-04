"use client";

import { useState } from "react";
import { Command } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SLASH_COMMANDS = [
  "/plan",
  "/decompose",
  "/repo-assist",
  "/approve-architecture",
  "/approve-sensitive",
] as const;

type SlashCommand = (typeof SLASH_COMMANDS)[number];

interface SlashCommandMenuProps {
  owner: string;
  repo: string;
  issueNumber: number;
  onActionComplete?: () => void;
}

export function SlashCommandMenu({
  owner,
  repo,
  issueNumber,
  onActionComplete,
}: SlashCommandMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCommandClick = async (command: SlashCommand) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/slash-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          issueNumber,
          command,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to post command");
        return;
      }

      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            data-testid="slash-command-menu"
          >
            <Command className="h-4 w-4 mr-2" />
            Slash Command
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SLASH_COMMANDS.map((command) => (
            <DropdownMenuItem
              key={command}
              onClick={() => handleCommandClick(command)}
              disabled={isLoading}
            >
              {command}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
