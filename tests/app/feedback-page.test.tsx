import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockGetCurrentUser, mockGetInterviewById, mockGetFeedback, mockRedirect, mockNotFound } =
  vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockGetInterviewById: vi.fn(),
    mockGetFeedback: vi.fn(),
    mockRedirect: vi.fn(),
    mockNotFound: vi.fn(),
  }));

vi.mock("@/lib/actions/auth.action", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/actions/interviews.actions", () => ({
  getInterviewById: mockGetInterviewById,
}));

vi.mock("@/lib/actions/feedback.actions", () => ({
  getFeedbackByInterviewId: mockGetFeedback,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
  useRouter: () => ({ push: vi.fn() }),
}));

import FeedbackPage from "@/app/(root)/interview/[id]/feedback/page";

const interview = {
  id: "interview-1",
  role: "Frontend Developer",
  level: "Senior",
  type: "Technical",
  techstack: ["React"],
  questions: ["What is React?"],
  createdAt: "2026-01-01T00:00:00.000Z",
  userId: "user-1",
  finalized: true,
};

const feedback = {
  id: "feedback-1",
  interviewId: "interview-1",
  totalScore: 85,
  categoryScores: [
    { name: "Communication Skills", score: 80, comment: "Clear and concise." },
    { name: "Technical Knowledge", score: 85, comment: "Strong React knowledge." },
    { name: "Problem Solving", score: 90, comment: "Great approach." },
    { name: "Cultural Fit", score: 85, comment: "Good fit." },
    { name: "Confidence and Clarity", score: 85, comment: "Confident." },
  ],
  strengths: ["Clear communication"],
  areasForImprovement: ["Deeper edge-case coverage"],
  finalAssessment: "Strong candidate overall.",
  createdAt: "2026-01-02T00:00:00.000Z",
};

describe("/interview/[id]/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Mahim", email: "m@test.com" });
    mockGetInterviewById.mockResolvedValue(interview);
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  it("redirects unauthenticated users to sign-in", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    await expect(
      FeedbackPage({ params: Promise.resolve({ id: "interview-1" }) })
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });

  it("returns not found for an inaccessible interview", async () => {
    mockGetInterviewById.mockResolvedValueOnce(null);
    await expect(
      FeedbackPage({ params: Promise.resolve({ id: "missing" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows an empty state when no feedback exists", async () => {
    mockGetFeedback.mockResolvedValueOnce(null);
    const element = await FeedbackPage({ params: Promise.resolve({ id: "interview-1" }) });
    render(element);
    expect(screen.getByText("No feedback yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to interview" })).toHaveAttribute(
      "href",
      "/interview/interview-1"
    );
  });

  it("renders scores, strengths, and assessment", async () => {
    mockGetFeedback.mockResolvedValueOnce(feedback);
    const element = await FeedbackPage({ params: Promise.resolve({ id: "interview-1" }) });
    render(element);
    expect(screen.getByText("Overall score: 85 / 100")).toBeInTheDocument();
    expect(screen.getByText("Communication Skills")).toBeInTheDocument();
    expect(screen.getByText("Clear communication")).toBeInTheDocument();
    expect(screen.getByText("Deeper edge-case coverage")).toBeInTheDocument();
    expect(screen.getByText("Strong candidate overall.")).toBeInTheDocument();
    expect(mockGetFeedback).toHaveBeenCalledWith("interview-1", "user-1");
  });
});
