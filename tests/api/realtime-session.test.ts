import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetCurrentUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/actions/auth.action", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

import { POST } from "@/app/api/realtime/session/route";

describe("POST /api/realtime/session", () => {
  const originalEnv = process.env.OPENAI_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  const createRequest = () =>
    new Request("http://localhost/api/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Mahim",
        role: "frontend developer",
        level: "senior",
        techstack: ["React", "Next.js"],
        questions: ["Tell me about your React experience."],
      }),
    });

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mockGetCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Mahim",
      email: "mahim@example.com",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = originalEnv;
  });

  it("returns 500 if OPENAI_API_KEY missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await POST(createRequest());

    expect(res.status).toBe(500);

    const json = await res.json();

    expect(json.error).toMatch(/Missing/);
  });

  it("calls OpenAI with correct model, voice and Sarah intro", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: "secret123", id: "sess_123" }),
    } as Response);

    const res = await POST(createRequest());

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/realtime/client_secrets",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" }),
      })
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(body.session.model).toBe("gpt-realtime-2.1");
    expect([
      "alloy",
      "ash",
      "ballad",
      "coral",
      "echo",
      "sage",
      "shimmer",
      "verse",
      "marin",
      "cedar",
    ]).toContain(body.session.audio.output.voice);
    expect(body.session.instructions).toContain("Mahim");
    expect(body.session.instructions).toContain("professional interviewer");
  });

  it("forwards OpenAI error status", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    } as unknown as Response);

    const res = await POST(createRequest());

    expect(res.status).toBe(401);

    const json = await res.json();

    expect(json.error).toBe("Unauthorized");
  });

  it("returns client_secret on success", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    const mockData = { value: "tok", id: "sess" };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockData } as Response);

    const res = await POST(createRequest());
    const json = await res.json();

    expect(json.value).toBe("tok");
  });
});
