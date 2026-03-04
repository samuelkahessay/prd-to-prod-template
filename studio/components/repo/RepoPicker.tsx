"use client";

import { useState, useEffect } from "react";
import { useRepo } from "@/lib/repo/context";
import { getRecentRepos, removeRecentRepo, type RecentRepo } from "@/lib/repo/storage";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle2, AlertCircle, XCircle, X, FolderGit2, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ValidationStatus = "idle" | "validating" | "valid" | "warning" | "error";

interface ValidationResult {
  status: ValidationStatus;
  message?: string;
}

export function RepoPicker() {
  const { currentRepo, setRepo, clearRepo } = useRepo();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ status: "idle" });

  useEffect(() => {
    setRecentRepos(getRecentRepos());
  }, [currentRepo]);

  const validateRepo = async (owner: string, repo: string): Promise<ValidationResult> => {
    try {
      const response = await fetch(
        `/api/repo/validate?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );

      if (!response.ok) {
        return {
          status: "error",
          message: response.status === 404 ? "Repository not found" : "Failed to access repository",
        };
      }

      const data = await response.json();

      if (data.isPrdToProdRepo && data.hasWorkflows) {
        return { status: "valid", message: "Valid prd-to-prod repository" };
      } else if (data.isPrdToProdRepo && !data.hasWorkflows) {
        return { status: "warning", message: "Missing workflow files" };
      } else {
        return { status: "error", message: "Not a prd-to-prod repository" };
      }
    } catch (error) {
      return { status: "error", message: "Network error" };
    }
  };

  const handleSelectRepo = async (owner: string, repo: string) => {
    setValidation({ status: "validating" });
    const result = await validateRepo(owner, repo);
    setValidation(result);

    if (result.status === "valid" || result.status === "warning") {
      setRepo(owner, repo);
      setOpen(false);
      setInputValue("");
      setValidation({ status: "idle" });
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setValidation({ status: "idle" });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.includes("/")) {
      const [owner, repo] = inputValue.split("/").map((s) => s.trim());
      if (owner && repo) {
        handleSelectRepo(owner, repo);
      }
    }
  };

  const handleRemoveRecent = (owner: string, repo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentRepo(owner, repo);
    setRecentRepos(getRecentRepos());
  };

  const getStatusIcon = () => {
    switch (validation.status) {
      case "valid":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <FolderGit2 className="h-4 w-4 shrink-0" />
            <span className="truncate font-mono text-xs">
              {currentRepo ? `${currentRepo.owner}/${currentRepo.repo}` : "Select repository..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type owner/repo..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.includes("/") ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <Button
                    size="sm"
                    onClick={() => {
                      const [owner, repo] = inputValue.split("/").map((s) => s.trim());
                      if (owner && repo) {
                        handleSelectRepo(owner, repo);
                      }
                    }}
                    disabled={validation.status === "validating"}
                  >
                    {validation.status === "validating" ? "Validating..." : "Connect Repository"}
                  </Button>
                  {validation.status !== "idle" && validation.status !== "validating" && (
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon()}
                      <span className={cn(
                        validation.status === "error" && "text-red-600",
                        validation.status === "warning" && "text-yellow-600",
                        validation.status === "valid" && "text-green-600"
                      )}>
                        {validation.message}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                "Type owner/repo format"
              )}
            </CommandEmpty>

            {recentRepos.length > 0 && (
              <>
                <CommandGroup heading="Recent Repositories">
                  {recentRepos.map((recent) => (
                    <CommandItem
                      key={`${recent.owner}/${recent.repo}`}
                      value={`${recent.owner}/${recent.repo}`}
                      onSelect={() => handleSelectRepo(recent.owner, recent.repo)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="h-4 w-4" />
                        <span className="font-mono text-sm">
                          {recent.owner}/{recent.repo}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={(e) => handleRemoveRecent(recent.owner, recent.repo, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {currentRepo && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    clearRepo();
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  Clear current repository
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
