import "@testing-library/jest-dom/vitest";
import { vi, beforeAll, afterAll } from "vitest";

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Mona_Sans: () => ({ variable: "--font-mona-sans", className: "mona-sans" }),
  Geist: () => ({ variable: "--font-sans", className: "geist" }),
}));

// Mock next/image — strip Next-specific props that warn on <img>
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { createElement } = require("react");
    const { unoptimized, priority, fill, ...rest } = props as Record<string, unknown> & {
      unoptimized?: boolean;
      priority?: boolean;
      fill?: boolean;
    };
    void unoptimized;
    void priority;
    void fill;
    return createElement("img", rest);
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => {
    const { createElement } = require("react");
    return createElement("a", { href, ...props }, children);
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  redirect: vi.fn(),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Suppress console.warn/error in tests unless needed
const originalWarn = console.warn;
const originalError = console.error;
beforeAll(() => {
  vi.spyOn(console, "warn").mockImplementation((...args) => {
    // allow our explicit warn checks but suppress noisy Firebase warnings
    if (typeof args[0] === "string" && args[0].includes("Firebase admin")) return;
    originalWarn(...args);
  });
});
afterAll(() => {
  vi.restoreAllMocks();
});
