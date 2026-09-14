import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/interviews.actions";
import { feedbackSchema } from "@/constants";
import { groq } from "@ai-sdk/groq";
import { generateObject, generateText } from "ai";
import { z } from "zod";

const TranscriptSchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1),
    })
  )
  .min(1)
  .max(200);

const BodySchema = z.object({
  interviewId: z.string().min(1),
  transcript: TranscriptSchema,
  feedbackId: z.string().min(1).optional(),
});

const buildPrompt = (interview: Interview, transcript: { role: string; content: string }[]) => {
  const formattedTranscript = transcript
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n");

  return `You are an expert interview evaluator. Assess this job interview and return structured feedback.
    Role: ${interview.role}
    Level: ${interview.level}
    Type: ${interview.type}
    Tech stack: ${interview.techstack.join(", ")}
    Interview questions: ${interview.questions.join(" | ")}

    Transcript:
    ${formattedTranscript}

    Score each category from 0 to 100 with a specific comment.
    The total score should reflect overall interview performance.
    List concrete strengths and concrete areas for improvement.
    Provide a concise final assessment paragraph.
    Return only data matching the requested schema.`;
};

const parseFallbackFeedback = (text: string) => {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = codeBlock ? codeBlock[1] : text;
  const match = candidate.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("The AI did not return feedback JSON");
  }

  return feedbackSchema.parse(JSON.parse(match[0]));
};

export const GET = async () => {
  return Response.json({ success: true, data: "Ready" }, { status: 200 });
};

export const POST = async (request: Request) => {
  if (!db) {
    return Response.json({ error: "Database is not configured" }, { status: 500 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
        error: "Invalid feedback data",
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { interviewId, transcript, feedbackId } = parsedBody.data;
  const interview = await getInterviewById(interviewId, user.id);

  if (!interview) {
    return Response.json({ error: "Interview not found" }, { status: 404 });
  }

  const prompt = buildPrompt(interview, transcript);
  let feedback: z.infer<typeof feedbackSchema>;

  try {
    const result = await generateObject({
      model: groq("openai/gpt-oss-20b"),
      schema: feedbackSchema,
      prompt,
    });

    feedback = result.object;
  } catch (primaryError) {
    console.warn("Primary feedback model failed, falling back to groq/compound", primaryError);

    try {
      const fallback = await generateText({
        model: groq("groq/compound"),
        prompt: `${prompt}\n\nReturn only JSON matching this shape: {"totalScore": number, "categoryScores": [{"name": "...", "score": number, "comment": "..."}], "strengths": [...], "areasForImprovement": [...], "finalAssessment": "..."}`,
      });

      feedback = parseFallbackFeedback(fallback.text);
    } catch (fallbackError) {
      console.error("Feedback generation failed", fallbackError);
      return Response.json({ error: "Unable to generate feedback" }, { status: 502 });
    }
  }

  const createdAt = new Date().toISOString();
  const feedbackData = {
    ...feedback,
    interviewId,
    userId: user.id,
    transcript,
    createdAt,
  };

  let savedFeedbackId = feedbackId;

  if (savedFeedbackId) {
    const existing = await db.collection("feedback").doc(savedFeedbackId).get();

    if (!existing.exists || existing.data()?.userId !== user.id) {
      return Response.json({ error: "Feedback not found" }, { status: 404 });
    }

    await db.collection("feedback").doc(savedFeedbackId).set(feedbackData, { merge: true });
  } else {
    const reference = await db.collection("feedback").add(feedbackData);
    savedFeedbackId = reference.id;
  }

  await db.collection("interviews").doc(interviewId).set({ finalized: true }, { merge: true });

  return Response.json({ success: true, feedbackId: savedFeedbackId }, { status: 201 });
};
