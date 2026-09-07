// Keeping VAPI as a fallback untouched (constants/index.ts)

export const VOICES = ["alloy", "nova", "shimmer", "onyx"] as const;
export type Voice = (typeof VOICES)[number];

// TODO: Change the random names, change and make it better later.
export const VOICE_NAMES: Record<Voice, string> = {
  alloy: "Sarah",
  nova: "Nova",
  shimmer: "Shimmer",
  onyx: "Onyx",
};

export type RealtimeConfig = {
  model: "gpt-4o-realtime-preview-2024-12-17";
  voice: Voice;
  name: string;
  instructions: string;
};

export const getRealtimeConfig = (params: {
  role: string;
  level: string;
  techstack: string | string[];
  username: string[];
  questions: string[];
}): RealtimeConfig => {
  const { role, level, techstack, username, questions } = params;
  const voice = VOICES[Math.floor(Math.random() * VOICES.length)];
  const name = VOICE_NAMES[voice];

  return {
    model: "gpt-4o-realtime-preview-2024-12-17",
    voice,
    name,
    instructions: `You are ${name}, a warm, professional interviewer.
    Greet the candidate by name: "Hi ${username}, my name is ${name}, I'll be your interviewer today for the ${level} ${role} role."
    Tech stack for this role: ${techstack}.
    Ask these ${questions.length} questions one by one, wait for the answer, acknowledge briefly, then ask the next.
    Questions: ${questions.join(" | ")}
    Keep responses concise and human-like, one question at a time.`,
  };
};
