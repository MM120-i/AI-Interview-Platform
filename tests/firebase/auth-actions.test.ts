import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockVerifySessionCookie = vi.fn();
const mockGetUserByEmail = vi.fn();
const mockCreateSessionCookie = vi.fn();

vi.mock("@/firebase/admin", () => ({
  auth: {
    verifySessionCookie: (...args: unknown[]) => mockVerifySessionCookie(...args),
    getUserByEmail: (...args: unknown[]) => mockGetUserByEmail(...args),
    createSessionCookie: (...args: unknown[]) => mockCreateSessionCookie(...args),
  },
  db: {
    collection: (...args: unknown[]) => mockCollection(...args),
  },
}));

const mockCookiesGet = vi.fn();
const mockCookiesSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: mockCookiesGet,
    set: mockCookiesSet,
  }),
}));

import { getCurrentUser, isAuthenticated, signUp, signIn } from "@/lib/actions/auth.action";

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue({ doc: mockDoc });
    mockDoc.mockReturnValue({ get: mockGet, set: mockSet });
  });

  describe("getCurrentUser", () => {
    it("returns null when no session cookie", async () => {
      mockCookiesGet.mockReturnValue(undefined);
      const user = await getCurrentUser();
      expect(user).toBeNull();
      expect(mockVerifySessionCookie).not.toHaveBeenCalled();
    });

    it("returns null when session invalid", async () => {
      mockCookiesGet.mockReturnValue({ value: "bad-cookie" });
      mockVerifySessionCookie.mockRejectedValue(new Error("invalid"));
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it("returns user when session valid and user exists", async () => {
      mockCookiesGet.mockReturnValue({ value: "valid-cookie" });
      mockVerifySessionCookie.mockResolvedValue({ uid: "user123" });
      mockGet.mockResolvedValue({
        exists: true,
        id: "user123",
        data: () => ({ name: "John", email: "john@test.com" }),
      });
      const user = await getCurrentUser();
      expect(user).toEqual({ name: "John", email: "john@test.com", id: "user123" });
    });

    it("returns null when user doc not found", async () => {
      mockCookiesGet.mockReturnValue({ value: "valid-cookie" });
      mockVerifySessionCookie.mockResolvedValue({ uid: "user123" });
      mockGet.mockResolvedValue({ exists: false });
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("returns true when user exists", async () => {
      mockCookiesGet.mockReturnValue({ value: "valid-cookie" });
      mockVerifySessionCookie.mockResolvedValue({ uid: "user123" });
      mockGet.mockResolvedValue({ exists: true, id: "user123", data: () => ({}) });
      expect(await isAuthenticated()).toBe(true);
    });

    it("returns false when no user", async () => {
      mockCookiesGet.mockReturnValue(undefined);
      expect(await isAuthenticated()).toBe(false);
    });
  });

  describe("signUp", () => {
    it("creates new user when not exists", async () => {
      mockGet.mockResolvedValue({ exists: false });
      mockSet.mockResolvedValue({});
      const result = await signUp({ uid: "uid1", name: "John", email: "john@test.com", password: "pass" });
      expect(result.success).toBe(true);
      expect(mockSet).toHaveBeenCalledWith({ name: "John", email: "john@test.com" });
    });

    it("returns false when user already exists", async () => {
      mockGet.mockResolvedValue({ exists: true });
      const result = await signUp({ uid: "uid1", name: "John", email: "john@test.com", password: "pass" });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/already exists/);
    });
  });

  describe("signIn", () => {
    it("returns false when user does not exist", async () => {
      mockGetUserByEmail.mockResolvedValue(null as unknown as { uid: string });
      const result = await signIn({ email: "no@test.com", idToken: "tok" });
      expect(result?.success).toBe(false);
    });
  });
});
