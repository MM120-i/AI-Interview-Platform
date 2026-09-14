import { describe, it, expect } from "vitest";
import { cn, getTechLogos, getRandomInterviewCover } from "@/lib/utils";
import { interviewCovers } from "@/constants";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("p-2", "m-2")).toBe("p-2 m-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", undefined, null)).toBe("base");
  });

  it("deduplicates tailwind conflicts via tailwind-merge", () => {
    // p-2 and p-4 conflict — last wins
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("getTechLogos", () => {
  it("returns correct devicon URLs for known tech", () => {
    const result = getTechLogos(["React", "Next.js", "TypeScript"]);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      tech: "React",
      url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    });
    expect(result[1].url).toContain("nextjs");
    expect(result[2].url).toContain("typescript");
  });

  it("falls back to /tech.svg for unknown tech", () => {
    const result = getTechLogos(["UnknownTechXYZ"]);
    expect(result[0].url).toBe("/tech.svg");
    expect(result[0].tech).toBe("UnknownTechXYZ");
  });

  it("handles case insensitivity and .js suffix", () => {
    const result = getTechLogos(["react.js", "NODE.JS", " tailwind "] as unknown as string[]);
    // react.js → react, NODE.JS → nodejs, tailwind with spaces → tailwindcss fallback or normalized
    expect(result[0].url).toContain("react");
  });

  it("handles empty array", () => {
    expect(getTechLogos([])).toEqual([]);
  });

  it("preserves original tech name", () => {
    const result = getTechLogos(["React"]);
    expect(result[0].tech).toBe("React");
  });
});

describe("getRandomInterviewCover", () => {
  it("is deterministic for same id (avoids hydration mismatch)", () => {
    const a = getRandomInterviewCover("1");
    const b = getRandomInterviewCover("1");
    expect(a).toBe(b);
  });

  it("produces different covers for different ids", () => {
    const a = getRandomInterviewCover("1");
    const b = getRandomInterviewCover("2");
    expect(a).not.toBe(b);
  });

  it("returns a valid cover path", () => {
    const cover = getRandomInterviewCover("test-id");
    expect(cover).toMatch(/^\/covers\/.+\.png$/);
    expect(interviewCovers.map((c) => `/covers${c}`)).toContain(cover);
  });

  it("uses default seed when id is undefined", () => {
    const a = getRandomInterviewCover(undefined);
    const b = getRandomInterviewCover(undefined);
    expect(a).toBe(b);
    expect(a).toMatch(/^\/covers\/.+\.png$/);
  });

  it("handles empty string", () => {
    const cover = getRandomInterviewCover("");
    expect(cover).toMatch(/^\/covers\/.+\.png$/);
  });

  it("is pure — same id always same output across calls", () => {
    for (let i = 0; i < 5; i++) {
      expect(getRandomInterviewCover("stable-id")).toBe(getRandomInterviewCover("stable-id"));
    }
  });
});
