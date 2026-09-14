import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockGetCurrentUser, mockGetInterviewById, mockRedirect, mockNotFound } = vi.hoisted(
  () => ({
    mockGetCurrentUser: vi.fn(),
    mockGetInterviewById: vi.fn(),
    mockRedirect: vi.fn(),
    mockNotFound: vi.fn(),
  })
);

vi.mock("@/lib/actions/auth.action", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/actions/interviews.actions", () => ({
  getInterviewById: mockGetInterviewById,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

vi.mock("@/components/Agent", () => ({
  default: ({ userName, questions }: { userName: string; questions: string[] }) => (
    <div data-testid="agent" data-questions={JSON.stringify(questions)}>
      {userName}
    </div>
  ),
}));

import InterviewPage from "@/app/(root)/interview/[id]/page";

describe("/interview/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Mahim",
      email: "mahim@example.com",
    });
  });

  it("loads an owned interview and passes its questions to Agent", async () => {
    mockGetInterviewById.mockResolvedValue({
      id: "interview-1",
      role: "Frontend Developer",
      level: "Senior",
      type: "Technical",
      techstack: ["React"],
      questions: ["What is React?"],
      createdAt: "2026-01-01T00:00:00.000Z",
      userId: "user-1",
      finalized: false,
    });

    const element = await InterviewPage({
      params: Promise.resolve({ id: "interview-1" }),
    });

    render(element);

    expect(screen.getByRole("heading", { name: "Frontend Developer Interview" })).toBeInTheDocument();
    expect(screen.getByTestId("agent")).toHaveTextContent("Mahim");
    expect(screen.getByTestId("agent")).toHaveAttribute(
      "data-questions",
      JSON.stringify(["What is React?"])
    );
    expect(mockGetInterviewById).toHaveBeenCalledWith("interview-1", "user-1");
  });

  it("returns not found for an inaccessible interview", async () => {
    mockGetInterviewById.mockResolvedValue(null);
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      InterviewPage({ params: Promise.resolve({ id: "missing" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
