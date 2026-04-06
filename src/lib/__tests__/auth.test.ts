// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { jwtVerify } from "jose";

// Mock server-only so it doesn't throw in test environment
vi.mock("server-only", () => ({}));

// Mock next/headers cookies
const mockSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ set: mockSet })),
}));

beforeEach(() => {
  mockSet.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// Import after mocks are set up
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

test("createSession sets an auth-token cookie", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  expect(mockSet.mock.calls[0][0]).toBe("auth-token");
});

test("createSession cookie is httpOnly", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
});

test("createSession cookie is not secure outside production", async () => {
  vi.stubEnv("NODE_ENV", "test");
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2];
  expect(options.secure).toBe(false);
});

test("createSession cookie is secure in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2];
  expect(options.secure).toBe(true);
});

test("createSession cookie expires in ~7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const expires: Date = mockSet.mock.calls[0][2].expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession token is a valid JWT containing userId and email", async () => {
  await createSession("user-123", "hello@example.com");

  const token: string = mockSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("hello@example.com");
});
