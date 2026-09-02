import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdd = vi.fn().mockResolvedValue({});
const mockGenerateText = vi.fn();

// Mock firebase admin
vi.mock("@/firebase/admin", () => ({
  db: { collection: () => ({ add: mockAdd }) },
}));

// Mock ai + groq
vi.mock("ai", () => ({ generateText: (...args: unknown[]) => mockGenerateText(...args) }));
vi.mock("@ai-sdk/groq", () => ({ groq: (model: string) => model }));

// Import after mocks
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
  });

  const baseBody = {
    type: "mixed",
    role: "frontend",
    level: "senior",
    techstack: "next.js",
    amount: 3,
    userid: "user123",
  };

  it("validates body with zod and returns success with primary LLM", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '["Q1", "Q2", "Q3"]' });
    const req = new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify(baseBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "frontend",
        questions: ["Q1", "Q2", "Q3"],
        techstack: ["next.js"],
      })
    );
  });

  it("handles techstack as array", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '["Q1"]' });
    const req = new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify({ ...baseBody, techstack: ["React", "Next.js"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ techstack: ["React", "Next.js"] }));
  });

  it("falls back to groq/compound when primary fails", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("Primary failed")).mockResolvedValueOnce({ text: '["Fallback Q"]' });
    const req = new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify(baseBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ questions: ["Fallback Q"] }));
  });

  it("parses questions even with reasoning markdown", async () => {
    const reasoningText = '**Reasoning** Thinking...\n```json\n["Q1", "Q2"]\n```';
    mockGenerateText.mockResolvedValueOnce({ text: reasoningText });
    const req = new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify(baseBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ questions: ["Q1", "Q2"] }));
  });

  it("rejects invalid body (zod)", async () => {
    const req = new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify({ type: "mixed" }), // missing fields
    });
    await expect(POST(req)).rejects.toThrow();
  });

  it("trims techstack string with commas", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '["Q1"]' });
    const req = new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify({ ...baseBody, techstack: "React, Next.js , Tailwind" }),
    });
    const res = await POST(req);
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ techstack: ["React", "Next.js", "Tailwind"] }));
  });
});
