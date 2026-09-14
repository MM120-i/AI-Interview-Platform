import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAdd, mockSet, mockDoc, mockGet, mockGenerateObject, mockGenerateText, mockGetCurrentUser, mockGetInterviewById } =
  vi.hoisted(() => ({
    mockAdd: vi.fn(),
    mockSet: vi.fn(),
    mockDoc: vi.fn(),
    mockGet: vi.fn(),
    mockGenerateObject: vi.fn(),
    mockGenerateText: vi.fn(),
    mockGetCurrentUser: vi.fn(),
    mockGetInterviewById: vi.fn(),
  }));

vi.mock("@/firebase/admin", () => ({
  db: {
    collection: vi.fn((name: string) => {
      if (name === "feedback") {
        return { add: mockAdd, doc: mockDoc };
      }
      return { doc: () => ({ get: mockGet, set: mockSet }) };
    }),
  },
}));

vi.mock("@/lib/actions/auth.action", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/actions/interviews.actions", () => ({
  getInterviewById: mockGetInterviewById,
}));

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));
vi.mock("@ai-sdk/groq", () => ({ groq: (model: string) => model }));

import { POST, GET } from "@/app/api/feedback/generate/route";

const validFeedback = {
  totalScore: 85,
  categoryScores: [
    { name: "Communication Skills", score: 80, comment: "Clear" },
    { name: "Technical Knowledge", score: 85, comment: "Strong" },
    { name: "Problem Solving", score: 90, comment: "Great" },
    { name: "Cultural Fit", score: 85, comment: "Good fit" },
    { name: "Confidence and Clarity", score: 85, comment: "Confident" },
  ],
  strengths: ["Clear communication"],
  areasForImprovement: ["Depth on edge cases"],
  finalAssessment: "Strong candidate overall.",
};

describe("GET /api/feedback/generate", () => {
  it("returns Ready", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("POST /api/feedback/generate", () => {
  const baseBody = {
    interviewId: "interview-1",
    transcript: [
      { role: "assistant", content: "Tell me about React." },
      { role: "user", content: "React is a UI library." },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Mahim", email: "m@test.com" });
    mockGetInterviewById.mockResolvedValue({
      id: "interview-1",
      role: "Frontend",
      level: "Senior",
      type: "Technical",
      techstack: ["React"],
      questions: ["Tell me about React."],
      createdAt: "2026-01-01",
      userId: "user-1",
      finalized: false,
    });
    mockAdd.mockResolvedValue({ id: "feedback-1" });
    mockDoc.mockReturnValue({ get: mockGet, set: mockSet });
  });

  const createRequest = (body: unknown) =>
    new Request("http://localhost/api/feedback/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("rejects unauthenticated requests", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(createRequest(baseBody));
    expect(res.status).toBe(401);
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it("returns 404 when interview is not owned", async () => {
    mockGetInterviewById.mockResolvedValueOnce(null);
    const res = await POST(createRequest(baseBody));
    expect(res.status).toBe(404);
  });

  it("generates feedback with primary model and saves it", async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: validFeedback });
    const res = await POST(createRequest(baseBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.feedbackId).toBe("feedback-1");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ interviewId: "interview-1", totalScore: 85 })
    );
  });

  it("falls back to compound model when primary fails", async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error("primary down"));
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validFeedback) });
    const res = await POST(createRequest(baseBody));
    expect(res.status).toBe(201);
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });

  it("returns 502 when both models fail", async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error("primary down"));
    mockGenerateText.mockResolvedValueOnce({ text: "not json at all {{{" });
    const res = await POST(createRequest(baseBody));
    expect(res.status).toBe(502);
  });

  it("returns 400 for invalid transcript", async () => {
    const res = await POST(createRequest({ interviewId: "interview-1", transcript: [] }));
    expect(res.status).toBe(400);
  });
});
