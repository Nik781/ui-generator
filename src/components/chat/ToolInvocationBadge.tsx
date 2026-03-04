"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolName: string;
    args: Record<string, unknown>;
    state: string;
    result?: unknown;
  };
}

// Extract just the filename from a full path (e.g. "/components/Card.tsx" → "Card.tsx")
function getFilename(path: unknown): string {
  if (typeof path !== "string" || !path) return "";
  return path.split("/").pop() || path;
}

// Build a human-readable label describing what the tool is doing
function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename = getFilename(args.path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Viewing ${filename}`;
      case "undo_edit":
        return `Undoing edit in ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename":
        return `Renaming ${filename}`;
      case "delete":
        return `Deleting ${filename}`;
    }
  }

  // Fallback for unknown tools or commands
  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const isComplete = state === "result" && result != null;
  const label = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        // Green dot indicates the tool call completed successfully
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        // Spinner indicates the tool call is still in progress
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
