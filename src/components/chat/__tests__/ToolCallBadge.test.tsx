import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());
import { ToolCallBadge } from "../ToolCallBadge";

// str_replace_editor labels
test("shows 'Creating <filename>' for str_replace_editor create", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor str_replace", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/components/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor insert", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/App.jsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Reading <filename>' for str_replace_editor view", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading App.jsx")).toBeDefined();
});

// file_manager labels
test("shows 'Deleting <filename>' for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/utils/helpers.ts" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting helpers.ts")).toBeDefined();
});

test("shows 'Renaming <from> to <to>' for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/App.jsx", new_path: "/App.tsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Renaming App.jsx to App.tsx")).toBeDefined();
});

// Fallback for unknown tools
test("falls back to raw tool name for unknown tools", () => {
  render(
    <ToolCallBadge
      toolName="unknown_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

// Loading vs done state
test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows green dot when state is 'result'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
