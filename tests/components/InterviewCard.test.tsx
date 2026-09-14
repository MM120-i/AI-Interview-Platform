import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import InterviewCard from "@/components/InterviewCard";

vi.mock("dayjs", () => ({
  __esModule: true,
  default: (date: unknown) => ({
    format: () => "Mar 15, 2024",
  }),
}));

describe("InterviewCard", () => {
  const baseProps = {
    interviewId: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript"],
    createdAt: "2024-03-15T10:00:00Z",
  };

  it("renders role and type", () => {
    render(<InterviewCard {...baseProps} />);
    expect(screen.getByText("Frontend Developer Interview")).toBeInTheDocument();
    expect(screen.getByText("Technical")).toBeInTheDocument();
  });

  it("normalizes Mixed type", () => {
    render(<InterviewCard {...baseProps} type="Mixed" />);
    expect(screen.getByText("Mixed")).toBeInTheDocument();
  });

  it("shows fallback type when not mixed", () => {
    render(<InterviewCard {...baseProps} type="Technical" />);
    expect(screen.getByText("Technical")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<InterviewCard {...baseProps} />);
    expect(screen.getByText("Mar 15, 2024")).toBeInTheDocument();
  });

  it("is deterministic cover for same interviewId (hydration safety)", () => {
    const { container: c1 } = render(<InterviewCard {...baseProps} interviewId="1" />);
    const { container: c2 } = render(<InterviewCard {...baseProps} interviewId="1" />);
    const src1 = c1.querySelector('img[alt="cover image"]')?.getAttribute("src");
    const src2 = c2.querySelector('img[alt="cover image"]')?.getAttribute("src");
    expect(src1).toBe(src2);
  });

  it("renders DisplayTechIcons with techstack", () => {
    render(<InterviewCard {...baseProps} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders View Interview link when no feedback", () => {
    render(<InterviewCard {...baseProps} />);
    const link = screen.getByRole("link", { name: "View Interview" });
    expect(link).toHaveAttribute("href", "/interview/1");
  });

  it("shows -- / 100 when no feedback", () => {
    render(<InterviewCard {...baseProps} />);
    expect(screen.getByText("-- / 100")).toBeInTheDocument();
  });

  it("has card styling", () => {
    const { container } = render(<InterviewCard {...baseProps} />);
    expect(container.querySelector(".card-interview")).toBeInTheDocument();
  });
});
