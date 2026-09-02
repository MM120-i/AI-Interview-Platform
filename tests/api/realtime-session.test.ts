import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/realtime/session/route";

describe("POST /api/realtime/session", () => {
  const originalEnv = process.env.OPENAI_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.OPENAI_API_KEY = originalEnv;
  });

  it("returns 500 if OPENAI_API_KEY missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Missing/);
  });

  it("calls OpenAI with correct model, voice and Sarah intro", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client_secret: { value: "secret123" }, id: "sess_123" }),
    } as Response);

    const res = await POST();
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/realtime/sessions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" }),
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("gpt-4o-realtime-preview-2024-12-17");
    expect(body.voice).toBe("alloy");
    expect(body.instructions).toContain("Sarah");
    expect(body.instructions).toContain("professional interviewer");
  });

  it("forwards OpenAI error status", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as unknown as Response);

    const res = await POST();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns client_secret on success", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const mockData = { client_secret: { value: "tok" }, id: "sess" };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockData } as Response);
    const res = await POST();
    const json = await res.json();
    expect(json.client_secret.value).toBe("tok");
  });
});
