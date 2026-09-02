import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import FormField from "@/components/FormField";

const schema = z.object({ username: z.string().min(1) });

function Wrapper({ type = "text", placeholder }: { type?: string; placeholder?: string }) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "" },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="username"
        label="Username"
        placeholder={placeholder}
        type={type as never}
      />
    </Form>
  );
}

describe("FormField", () => {
  it("renders label and input", () => {
    render(<Wrapper label-test placeholder="Enter name" />);
    render(<Wrapper />);
    expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText("Enter name").length).toBeGreaterThan(0);
  });

  it("renders with email type", () => {
    render(<Wrapper type="email" placeholder="Your Email Address" />);
    const input = screen.getByPlaceholderText("Your Email Address") as HTMLInputElement;
    expect(input.type).toBe("email");
  });

  it("renders password type", () => {
    render(<Wrapper type="password" placeholder="Your password" />);
    const input = screen.getByPlaceholderText("Your password") as HTMLInputElement;
    expect(input.type).toBe("password");
  });

  it("applies label class", () => {
    render(<Wrapper />);
    const labels = screen.getAllByText("Username");
    expect(labels[0].className).toContain("label");
  });
});
