import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Capture the onFinished callback passed to Agent
const capturedProps: { onFinished?: (t: { role: "user" | "assistant"; content: string }[]) => void } = {};

vi.mock("@/components/Agent", () => ({
  default: (props: AgentProps) => {
    capturedProps.onFinished = props.onFinished;
    return (
      <div data-testid="agent-stub">
        {props.userName} / {(props.questions ?? []).length} questions
      </div>
    );
  },
}));

import InterviewSession from "@/components/InterviewSession";

const transcript = [
  { role: "assistant" as const, content: "Tell me about React." },
  { role: "user" as const, content: "React is a UI library." },
];

describe("InterviewSession", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders Agent with interview props", () => {
    render(
      <InterviewSession userName="Mahim" userId="u-1" interviewId="i-1" questions={["Q1"]} />
    );
    expect(screen.getByTestId("agent-stub")).toHaveTextContent("Mahim");
    expect(typeof capturedProps.onFinished).toBe("function");
  });

  it("posts transcript and navigates to feedback on finish", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, feedbackId: "f-1" }),
    });
    render(
      <InterviewSession userName="Mahim" userId="u-1" interviewId="i-1" questions={["Q1"]} />
    );

    await capturedProps.onFinished?.(transcript);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/feedback/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ interviewId: "i-1", transcript }),
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/interview/i-1/feedback");
    expect(toast.success).toHaveBeenCalled();
  });

  it("rejects empty transcripts without calling the API", async () => {
    render(
      <InterviewSession userName="Mahim" userId="u-1" interviewId="i-1" questions={["Q1"]} />
    );

    await capturedProps.onFinished?.([]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it("shows an error and stays put when generation fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unable to generate feedback" }),
    });
    render(
      <InterviewSession userName="Mahim" userId="u-1" interviewId="i-1" questions={["Q1"]} />
    );

    await capturedProps.onFinished?.(transcript);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(mockPush).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();

    // End the interview manually via Agent stop is out of scope; just assert error UI path
    const user = userEvent.setup();
    void user;
  });
});
