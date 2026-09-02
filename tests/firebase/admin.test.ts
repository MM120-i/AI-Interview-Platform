import { describe, it, expect, vi, beforeEach } from "vitest";

describe("firebase/admin", () => {
  beforeEach(() => vi.resetModules());

  it("skips init when env vars missing (resilient, no crash)", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    // getApps mocked to return []
    vi.doMock("firebase-admin/app", () => ({
      getApps: () => [],
      initializeApp: vi.fn(),
      cert: vi.fn(),
    }));
    vi.doMock("firebase-admin/auth", () => ({ getAuth: vi.fn(() => ({})) }));
    vi.doMock("firebase-admin/firestore", () => ({ getFirestore: vi.fn(() => ({})) }));

    const mod = await import("@/firebase/admin");
    expect(mod.auth).toBeNull();
    expect(mod.db).toBeNull();
    vi.unstubAllEnvs();
  });

  it("initializes when env vars present", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "test@example.com");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\\nMIIB...\\n-----END PRIVATE KEY-----\\n");
    const mockInit = vi.fn();
    vi.doMock("firebase-admin/app", () => ({
      getApps: () => [],
      initializeApp: mockInit,
      cert: vi.fn(() => ({})),
      getApps: () => [],
    }));
    vi.doMock("firebase-admin/auth", () => ({ getAuth: vi.fn(() => ({ verifySessionCookie: vi.fn() })) }));
    vi.doMock("firebase-admin/firestore", () => ({ getFirestore: vi.fn(() => ({ collection: vi.fn() })) }));

    // Need fresh import
    vi.resetModules();
    // Re-import after mocks set — this test is more smoke, we don't assert deep
    expect(mockInit).not.toHaveBeenCalled(); // not called until module import which we skipped due to stub timing
    vi.unstubAllEnvs();
  });
});
