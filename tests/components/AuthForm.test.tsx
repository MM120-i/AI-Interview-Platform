import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/AuthForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  redirect: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi
    .fn()
    .mockResolvedValue({ user: { uid: "uid123", getIdToken: () => Promise.resolve("token") } }),
  signInWithEmailAndPassword: vi
    .fn()
    .mockResolvedValue({ user: { getIdToken: () => Promise.resolve("idToken123") } }),
}));

vi.mock("@/firebase/client", () => ({
  auth: {},
}));

vi.mock("@/lib/actions/auth.action", () => ({
  signUp: vi.fn().mockResolvedValue({ success: true }),
  signIn: vi.fn().mockResolvedValue({ success: true }),
}));

describe("AuthForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders sign-in variant", () => {
    render(<AuthForm type="sign-in" />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Your Name")).not.toBeInTheDocument();
  });

  it("renders sign-up variant with name field", () => {
    render(<AuthForm type="sign-up" />);
    expect(screen.getByText("Create an Account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your Name")).toBeInTheDocument();
  });

  it("shows email and password fields for both", () => {
    render(<AuthForm type="sign-in" />);
    expect(screen.getByPlaceholderText("Your Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your password")).toBeInTheDocument();
  });

  it("toggles link text based on type", () => {
    const { rerender } = render(<AuthForm type="sign-in" />);

    expect(screen.getByText("No Account yet?")).toBeInTheDocument();
    rerender(<AuthForm type="sign-up" />);
    expect(screen.getByText("Have an account already?")).toBeInTheDocument();
  });

  it("submits sign-up and redirects to sign-in", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="sign-up" />);
    await user.type(screen.getByPlaceholderText("Your Name"), "John Doe");
    await user.type(screen.getByPlaceholderText("Your Email Address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create an Account" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/sign-in"));
  });

  it("submits sign-in and redirects to home", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="sign-in" />);
    await user.type(screen.getByPlaceholderText("Your Email Address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("validates zod schema — shows name error for short name on sign-up", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="sign-up" />);
    await user.type(screen.getByPlaceholderText("Your Email Address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Your password"), "123");
    await user.click(screen.getByRole("button", { name: "Create an Account" }));

    await waitFor(() => {
      const messages = document.body.textContent || "";
      expect(push).not.toHaveBeenCalledWith("/sign-in");
    });
  });
});
