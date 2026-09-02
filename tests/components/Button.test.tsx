import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const classes = buttonVariants({ variant: "destructive" });
    expect(classes).toContain("text-destructive");
  });

  it("applies size classes", () => {
    const classes = buttonVariants({ size: "icon" });
    expect(classes).toContain("size-8");
  });

  it("supports asChild mapping to Base UI render", () => {
    // asChild uses Base UI render prop — renders <a> as button (role=button, href preserved)
    render(
      <Button asChild>
        <a href="/interview">Start</a>
      </Button>
    );
    const el = screen.getByRole("button", { name: "Start" });
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("href", "/interview");
    expect(el.tagName.toLowerCase()).toBe("a");
  });

  it("renders with outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" })).toBeInTheDocument();
  });

  it("is disabled when prop set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });
});
