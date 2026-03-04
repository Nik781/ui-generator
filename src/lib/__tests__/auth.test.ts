// @vitest-environment node
// auth.ts is server-only code — use Node environment to avoid jsdom's
// Uint8Array realm mismatch which breaks jose's key validation
import { test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock "server-only" so it doesn't throw in the jsdom test environment
vi.mock("server-only", () => ({}));

// In-memory cookie store to simulate Next.js cookies()
const cookieStore = new Map<string, string>();

// Mock next/headers cookies() with get/set/delete backed by the in-memory store
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (name: string) => {
        const value = cookieStore.get(name);
        return value ? { name, value } : undefined;
      },
      set: vi.fn((name: string, value: string) => {
        cookieStore.set(name, value);
      }),
      delete: vi.fn((name: string) => {
        cookieStore.delete(name);
      }),
    })
  ),
}));

import { createSession } from "../auth";
import { jwtVerify } from "jose";

beforeEach(() => {
  cookieStore.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("createSession sets an auth-token cookie", async () => {
  await createSession("user-123", "test@example.com");
  expect(cookieStore.has("auth-token")).toBe(true);
});

test("createSession stores a valid JWT containing userId and email", async () => {
  await createSession("user-123", "test@example.com");

  const token = cookieStore.get("auth-token")!;
  const secret = new TextEncoder().encode("development-secret-key");

  // Verify the JWT is well-formed and signed with the expected secret
  const { payload } = await jwtVerify(token, secret);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession JWT expires in ~7 days", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const token = cookieStore.get("auth-token")!;
  const secret = new TextEncoder().encode("development-secret-key");
  const { payload } = await jwtVerify(token, secret);

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expMs = (payload.exp as number) * 1000;

  // Expiry should be within a 5-second window around 7 days from now
  expect(expMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 5000);
  expect(expMs).toBeLessThanOrEqual(after + sevenDaysMs + 5000);
});

test("createSession overwrites a previous session cookie", async () => {
  await createSession("user-1", "first@example.com");
  const firstToken = cookieStore.get("auth-token");

  await createSession("user-2", "second@example.com");
  const secondToken = cookieStore.get("auth-token");

  // A new token should have been written, replacing the first
  expect(secondToken).toBeDefined();
  expect(secondToken).not.toBe(firstToken);

  const secret = new TextEncoder().encode("development-secret-key");
  const { payload } = await jwtVerify(secondToken!, secret);
  expect(payload.email).toBe("second@example.com");
});
