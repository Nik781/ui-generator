import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor labels ---

test("shows 'Creating' for str_replace_editor create command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Card.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Viewing' for str_replace_editor view command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "view", path: "/index.ts" },
        state: "result",
        result: "file contents",
      }}
    />
  );
  expect(screen.getByText("Viewing index.ts")).toBeDefined();
});

test("shows 'Undoing edit in' for str_replace_editor undo_edit command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "undo_edit", path: "/Button.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Undoing edit in Button.tsx")).toBeDefined();
});

// --- file_manager labels ---

test("shows 'Renaming' for file_manager rename command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "file_manager",
        args: { command: "rename", path: "/old.tsx", new_path: "/new.tsx" },
        state: "result",
        result: { success: true },
      }}
    />
  );
  expect(screen.getByText("Renaming old.tsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "file_manager",
        args: { command: "delete", path: "/unused.tsx" },
        state: "result",
        result: { success: true },
      }}
    />
  );
  expect(screen.getByText("Deleting unused.tsx")).toBeDefined();
});

// --- Fallback ---

test("falls back to raw toolName for unknown tools", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "some_unknown_tool",
        args: {},
        state: "result",
        result: "done",
      }}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// --- State indicators ---

test("shows green dot when state is 'result' and result is present", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Card.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  // Green dot is a div with bg-emerald-500
  const dot = container.querySelector(".bg-emerald-500");
  expect(dot).not.toBeNull();
  // No spinner when complete
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is not 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Card.tsx" },
        state: "call",
      }}
    />
  );
  // Spinner is present
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  // No green dot when in progress
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when result is null/undefined even if state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Card.tsx" },
        state: "result",
        result: undefined,
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
