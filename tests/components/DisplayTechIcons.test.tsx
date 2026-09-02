import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DisplayTechIcons from "@/components/DisplayTechIcons";

describe("DisplayTechIcons", () => {
  it("renders tech names as tooltips", () => {
    render(<DisplayTechIcons techStack={["React", "Next.js"]} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });

  it("renders up to 3 icons", () => {
    render(<DisplayTechIcons techStack={["React", "Next.js", "TypeScript", "Tailwind CSS"]} />);
    // 4th should be sliced off
    expect(screen.queryByText("Tailwind CSS")).not.toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders images with devicon URLs", () => {
    render(<DisplayTechIcons techStack={["React"]} />);
    const img = screen.getByAltText("React") as HTMLImageElement;
    expect(img.src).toContain("devicon");
    expect(img.src).toContain("react");
  });

  it("falls back to /tech.svg for unknown tech", () => {
    render(<DisplayTechIcons techStack={["UnknownXYZ"]} />);
    const img = screen.getByAltText("UnknownXYZ") as HTMLImageElement;
    expect(img.src).toContain("tech.svg");
  });

  it("handles empty techStack", () => {
    const { container } = render(<DisplayTechIcons techStack={[]} />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("applies overlapping style for index >=1", () => {
    const { container } = render(<DisplayTechIcons techStack={["React", "Next.js"]} />);
    const divs = container.querySelectorAll("div.flex-center");
    // second should have -ml-3
    expect(divs[1].className).toContain("-ml-3");
  });
});
