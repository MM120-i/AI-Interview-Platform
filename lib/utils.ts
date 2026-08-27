import { clsx, type ClassValue } from "clsx";
import { interviewCovers, mappings } from "@/constants";
import { twMerge } from "tailwind-merge";

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

export const getTechLogos = (techArray: string[]) => {
  return techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    const url = normalized
      ? `${techIconBaseURL}/${normalized}/${normalized}-original.svg`
      : "/tech.svg";

    return {
      tech,
      url,
    };
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRandomInterviewCover = (id?: string) => {
  const seed = id ?? "default";
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return `/covers${interviewCovers[hash % interviewCovers.length]}`;
};
