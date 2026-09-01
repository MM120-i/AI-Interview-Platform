import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const GET = async () => {
  return Response.json({ success: true, data: "Thank u" }, { status: 200 });
};

export const POST = async (request: Request) => {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    const parseQuestions = (text: string): string[] => {
      const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const candidate = codeBlock ? codeBlock[1] : text;
      const arrayMatch = candidate.match(/\[[\s\S]*\]/);

      if (!arrayMatch)
        throw new SyntaxError(`No JSON array found in model output: ${text.slice(0, 500)}`);

      return JSON.parse(arrayMatch[0]);
    };

    // Free LLM — Groq (no billing card, generous free tier). Get key at https://console.groq.com/keys
    // groq/compound is reasoning-heavy (adds **Reasoning**), so we parse JSON array out; gpt-oss is cleaner for JSON
    const { text: questions } = await generateText({
      model: groq("openai/gpt-oss-20b"),
      prompt: `Prepare questions for a job interview. 
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    const interview = {
      role,
      type,
      level,
      techstack:
        typeof techstack === "string"
          ? techstack.split(",").map((s: string) => s.trim())
          : techstack,
      questions: parseQuestions(questions),
      userid: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(userid),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error }, { status: 500 });
  }
};
