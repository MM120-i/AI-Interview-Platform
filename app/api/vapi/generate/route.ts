import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";

const BodySchema = z.object({
  type: z.string(),
  role: z.string(),
  level: z.string(),
  techstack: z.union([z.string(), z.array(z.string())]),
  amount: z.coerce.number().min(1).max(10),
  userid: z.string(),
});

const parseQuestions = (text: string): string[] => {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = block ? block[1] : text;
  const match = candidate.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array");
  return JSON.parse(match[0]);
};

export const GET = async () => {
  return Response.json({ success: true, data: "Ready" }, { status: 200 });
};

export const POST = async (req: Request) => {
  const { type, role, level, techstack, amount, userid } = BodySchema.parse(await req.json());
  const prompt = `Prepare questions for a job interview.
    Role: ${role}, Level: ${level}, Tech: ${techstack}, Focus: ${type}, Amount: ${amount}
    Return ONLY JSON: ["Q1", "Q2", ...] — no "/" or "*"`;

  let questions: string;

  try {
    const r = await generateText({ model: groq("openai/gpt-oss-20b"), prompt });
    questions = r.text;
    parseQuestions(questions); // validate before fallback
  } catch (primaryError) {
    console.warn("Primary LLM failed, fallback to groq/compound", primaryError);
    const r = await generateText({ model: groq("groq/compound"), prompt });
    questions = r.text;
  }

  await db.collection("interviews").add({
    role,
    type,
    level,
    techstack: Array.isArray(techstack) ? techstack : techstack.split(",").map((s) => s.trim()),
    questions: parseQuestions(questions), // robust
    userid,
    finalized: true,
    coverImage: getRandomInterviewCover(userid),
    createdAt: new Date().toISOString(),
  });

  return Response.json({ success: true });
};
