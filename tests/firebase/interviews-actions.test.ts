import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCollection, mockWhere, mockGet, mockDoc, mockDocGet } = vi.hoisted(() => ({
  mockCollection: vi.fn(),
  mockWhere: vi.fn(),
  mockGet: vi.fn(),
  mockDoc: vi.fn(),
  mockDocGet: vi.fn(),
}));

vi.mock("@/firebase/admin", () => ({
  db: {
    collection: mockCollection,
  },
}));

vi.mock("server-only", () => ({}));

import {
  getInterviewById,
  getInterviewByUserId,
} from "@/lib/actions/interviews.actions";

const createDocument = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

describe("interview actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCollection.mockReturnValue({
      where: mockWhere,
      doc: mockDoc,
    });
    mockWhere.mockReturnValue({ get: mockGet });
    mockDoc.mockReturnValue({ get: mockDocGet });
  });

  describe("getInterviewByUserId", () => {
    it("filters interviews by userid", async () => {
      mockGet.mockResolvedValue({
        docs: [
          createDocument("interview-1", {
            userid: "user-1",
            role: "Frontend Developer",
            level: "Senior",
            type: "Technical",
            techstack: ["React"],
            questions: ["What is React?"],
            createdAt: "2026-01-01T10:00:00.000Z",
            finalized: true,
          }),
        ],
      });

      await getInterviewByUserId("user-1");

      expect(mockCollection).toHaveBeenCalledWith("interviews");
      expect(mockWhere).toHaveBeenCalledWith("userid", "==", "user-1");
    });

    it("maps Firestore documents and sorts newest first", async () => {
      mockGet.mockResolvedValue({
        docs: [
          createDocument("older", {
            userid: "user-1",
            role: "Backend Developer",
            level: "Junior",
            type: "Technical",
            techstack: ["Node.js"],
            questions: ["What is Node.js?"],
            createdAt: "2026-01-01T10:00:00.000Z",
            finalized: false,
          }),
          createDocument("newer", {
            userid: "user-1",
            role: "Frontend Developer",
            level: "Senior",
            type: "Mixed",
            techstack: ["React", "Next.js"],
            questions: ["What is React?"],
            createdAt: "2026-02-01T10:00:00.000Z",
            finalized: true,
          }),
        ],
      });

      const interviews = await getInterviewByUserId("user-1");

      expect(interviews.map((interview) => interview.id)).toEqual(["newer", "older"]);
      expect(interviews[0]).toMatchObject({
        id: "newer",
        userId: "user-1",
        role: "Frontend Developer",
        level: "Senior",
        type: "Mixed",
        techstack: ["React", "Next.js"],
        questions: ["What is React?"],
        finalized: true,
      });
    });

    it("returns an empty array when the user has no interviews", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      await expect(getInterviewByUserId("user-without-interviews")).resolves.toEqual([]);
    });
  });

  describe("getInterviewById", () => {
    it("returns null when the document does not exist", async () => {
      mockDocGet.mockResolvedValue({ exists: false });

      await expect(getInterviewById("missing-interview", "user-1")).resolves.toBeNull();
      expect(mockDoc).toHaveBeenCalledWith("missing-interview");
    });

    it("returns null when the interview belongs to another user", async () => {
      mockDocGet.mockResolvedValue({
        exists: true,
        id: "interview-1",
        data: () => ({ userid: "different-user" }),
      });

      await expect(getInterviewById("interview-1", "user-1")).resolves.toBeNull();
    });

    it("returns the interview when the user owns it", async () => {
      const document = createDocument("interview-1", {
        userid: "user-1",
        role: "Frontend Developer",
        level: "Senior",
        type: "Technical",
        techstack: ["React"],
        questions: ["What is React?"],
        createdAt: "2026-01-01T10:00:00.000Z",
        finalized: true,
      });

      mockDocGet.mockResolvedValue({ exists: true, ...document });

      await expect(getInterviewById("interview-1", "user-1")).resolves.toMatchObject({
        id: "interview-1",
        userId: "user-1",
        role: "Frontend Developer",
        finalized: true,
      });
    });
  });
});
