import { getCurrentUser } from "@/lib/actions/auth.action";
import { createHash } from "node:crypto";
import { getRealtimeConfig } from "@/lib/voice/config";
import { z } from "zod";

const requestSchema = z.object({
  username: z.string().optional(),
  role: z.string().default("software engineer"),
  level: z.string().default("general"),
  techstack: z.union([z.string(), z.array(z.string())]).default([]),
  questions: z.array(z.string()).default([]),
});

export const POST = async (request: Request) => {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = requestSchema.parse(await request.json());

    const config = getRealtimeConfig({
      username: input.username ?? user.name,
      role: input.role,
      level: input.level,
      techstack: input.techstack,
      questions: input.questions,
    });

    const safetyIdentifier = createHash("sha256").update(user.id).digest("hex");

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyIdentifier,
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime-2.1",
          instructions: config.instructions,
          audio: {
            input: {
              transcription: {
                model: "gpt-4o-mini-transcribe",
              },
              turn_detection: {
                type: "server_vad",
              },
            },
            output: {
              voice: config.voice,
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch {
    return Response.json(
      {
        error: "Unable to create realtime session",
      },
      { status: 500 }
    );
  }
};
