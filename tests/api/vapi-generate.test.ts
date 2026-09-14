import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAdd, mockGenerateText, mockGetCurrentUser } = vi.hoisted(() => ({
  mockAdd: vi.fn().mockResolvedValue({ id: "interview-1" }),
  mockGenerateText: vi.fn(),
  mockGetCurrentUser: vi.fn(),
}));

vi.mock("@/firebase/admin", () => ({
  db: { collection: () => ({ add: mockAdd }) },
}));

vi.mock("@/lib/actions/auth.action", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("ai", () => ({ generateText: (...args: unknown[]) => mockGenerateText(...args) }));
vi.mock("@ai-sdk/groq", () => ({ groq: (model: string) => model }));

import { POST, GET } from "@/app/api/vapi/generate/route";

describe("GET /api/vapi/generate", () => {
  it("returns Ready", async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toBe("Ready");
  });
});

describe("POST /api/vapi/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({
      id: "user123",
      name: "Test User",
      email: "test@example.com",
    });
  });

  const baseBody = {
    type: "mixed",
    role: "frontend",
    level: "senior",
    techstack: "next.js",
    amount: 3,
    userid: "user123",
  };

  const createRequest = (body: unknown) =>
    new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("rejects unauthenticated requests", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(createRequest(baseBody));

    expect(res.status).toBe(401);
    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not valid json",
      })
    );

    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Request body must be valid JSON");
  });

  it("validates body with zod and returns success with primary LLM", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '["Q1", "Q2", "Q3"]' });

    const res = await POST(createRequest(baseBody));

    expect(res.status).toBe(201);

    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.interviewId).toBe("interview-1");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "frontend",
        questions: ["Q1", "Q2", "Q3"],
        techstack: ["next.js"],
        userid: "user123",
        finalized: false,
      })
    );
  });

  it("uses the authenticated user's ID instead of a client-provided userid", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '["Q1"]' });

    const res = await POST(createRequest({ ...baseBody, userid: "attacker-id" }));

    expect(res.status).toBe(201);
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ userid: "user123" }));
  });

  it("handles techstack as array", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '["Q1"]' });

    const res = await POST(createRequest({ ...baseBody, techstack: ["React", "Next.js"] }));

    expect(res.status).toBe(201);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ techstack: ["React", "Next.js"] })
    );
  });

  it("falls back to groq/compound when primary fails", async () => {
    mockGenerateText
      .mockRejectedValueOnce(new Error("Primary failed"))
      .mockResolvedValueOnce({ text: '["Fallback Q"]' });

    const res = await POST(createRequest(baseBody));

    expect(res.status).toBe(201);
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ questions: ["Fallback Q"] }));
  });

  it("parses questions even with reasoning markdown", async () => {
    const reasoningText = '**Reasoning** Thinking...\n```json\n["Q1", "Q2"]\n```';
    mockGenerateText.mockResolvedValueOnce({ text: reasoningText });

    const res = await POST(createRequest(baseBody));

    expect(res.status).toBe(201);
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ questions: ["Q1", "Q2"] }));
  });

  it("returns 400 for an invalid body", async () => {
    const res = await POST(createRequest({ type: "mixed" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid interview data");
  });

  it("trims techstack string with commas", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '["Q1"]' });
    const res = await POST(
      createRequest({ ...baseBody, techstack: "React, Next.js , Tailwind" })
    );

    expect(res.status).toBe(201);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ techstack: ["React", "Next.js", "Tailwind"] })
    );
  });
});
