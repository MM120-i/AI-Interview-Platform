import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import InterviewForm from "@/components/InterviewForm";

describe("InterviewForm", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits valid data and navigates to the created interview", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, interviewId: "interview-123" }),
    });

    const user = userEvent.setup();
    render(<InterviewForm />);

    await user.type(screen.getByLabelText("Job role"), "Frontend Developer");
    await user.type(screen.getByLabelText("Tech stack"), "React, Next.js");
    await user.selectOptions(screen.getByLabelText("Experience level"), "senior");
    await user.selectOptions(screen.getByLabelText("Interview type"), "technical");
    await user.clear(screen.getByLabelText("Number of questions"));
    await user.type(screen.getByLabelText("Number of questions"), "7");
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/interview/interview-123"));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/vapi/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "Frontend Developer",
          level: "senior",
          techstack: "React, Next.js",
          amount: 7,
          type: "technical",
        }),
      })
    );
  });

  it("blocks submission when required fields are invalid", async () => {
    const user = userEvent.setup();
    render(<InterviewForm />);

    await user.click(screen.getByRole("button", { name: "Create interview" }));

    expect(await screen.findByText("Enter a valid job role")).toBeInTheDocument();
    expect(await screen.findByText("Enter at least one technology")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate when the API returns an error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unable to create interview" }),
    });

    const user = userEvent.setup();
    render(<InterviewForm />);

    await user.type(screen.getByLabelText("Job role"), "Frontend Developer");
    await user.type(screen.getByLabelText("Tech stack"), "React");
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate when the API omits interviewId", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<InterviewForm />);

    await user.type(screen.getByLabelText("Job role"), "Frontend Developer");
    await user.type(screen.getByLabelText("Tech stack"), "React");
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
