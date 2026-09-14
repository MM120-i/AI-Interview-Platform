import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";
import { getCurrentUser } from "@/lib/actions/auth.action";

const BodySchema = z.object({
  type: z.enum(["technical", "behavioral", "mixed"]),
  role: z.string().trim().min(2),
  level: z.string().trim().min(1),
  techstack: z.union([z.string(), z.array(z.string())]),
  amount: z.coerce.number().int().min(1).max(10),
});

const QuestionsSchema = z.array(z.string()).min(1);

const parseQuestions = (text: string): string[] => {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = codeBlock ? codeBlock[1] : text;
  const match = candidate.match(/\[[\s\S]*\]/);

  if (!match) {
    throw new Error("The AI did not return a question list");
  }

  return QuestionsSchema.parse(JSON.parse(match[0]));
};

export const GET = async () => {
  return Response.json({ success: true, data: "Ready" }, { status: 200 });
};

export const POST = async (request: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return Response.json({ error: "Database is not configured" }, { status: 500 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsedBody = BodySchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid interview data",
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { type, role, level, techstack, amount } = parsedBody.data;

  const techstackList = Array.isArray(techstack)
    ? techstack
    : techstack.split(",").map((item) => item.trim()).filter(Boolean);

  const prompt = `Prepare ${amount} job interview questions.
    Role: ${role}
    Experience level: ${level}
    Tech stack: ${techstackList.join(", ")}
    Interview focus: ${type}

    Return only a JSON array of question strings.
    Do not include markdown or additional text.`;

  let questionsText: string;

  try {
    const result = await generateText({
      model: groq("openai/gpt-oss-20b"),
      prompt,
    });

    questionsText = result.text;
    parseQuestions(questionsText);
  } catch {
    const fallback = await generateText({
      model: groq("groq/compound"),
      prompt,
    });

    questionsText = fallback.text;
  }

  const questions = parseQuestions(questionsText);

  const interview = await db.collection("interviews").add({
    role,
    type,
    level,
    techstack: techstackList,
    questions,
    userid: user.id,
    finalized: false,
    coverImage: getRandomInterviewCover(user.id),
    createdAt: new Date().toISOString(),
  });

  return Response.json(
    {
      success: true,
      interviewId: interview.id,
    },
    { status: 201 }
  );
};
