import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCollection, mockWhere, mockGet } = vi.hoisted(() => ({
  mockCollection: vi.fn(),
  mockWhere: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock("@/firebase/admin", () => ({
  db: { collection: mockCollection },
}));

vi.mock("server-only", () => ({}));

import { getFeedbackByInterviewId } from "@/lib/actions/feedback.actions";

const createDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

describe("feedback actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue({ where: mockWhere });
    // chain two where calls
    mockWhere.mockReturnValue({ where: vi.fn().mockReturnValue({ get: mockGet }) });
  });

  it("returns null when no feedback exists", async () => {
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] });
    // need to fix chain mock
    const { mockWhere: w } = { mockWhere };
    void w;
    await expect(getFeedbackByInterviewId("i-1", "u-1")).resolves.toBeNull();
  });

  it("returns the latest feedback", async () => {
    const docs = [
      createDoc("old", {
        interviewId: "i-1",
        totalScore: 70,
        categoryScores: [],
        strengths: ["a"],
        areasForImprovement: ["b"],
        finalAssessment: "old",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      createDoc("new", {
        interviewId: "i-1",
        totalScore: 90,
        categoryScores: [],
        strengths: ["a"],
        areasForImprovement: ["b"],
        finalAssessment: "new",
        createdAt: "2026-02-01T00:00:00.000Z",
      }),
    ];
    mockGet.mockResolvedValueOnce({ empty: false, docs });
    const feedback = await getFeedbackByInterviewId("i-1", "u-1");
    expect(feedback?.id).toBe("new");
    expect(feedback?.totalScore).toBe(90);
  });
});
