export const POST = async () => {
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
      instructions: "You are Sarah, a professional interviewer. Start with: 'Hi, my name is Sarah, I'll be your interviewer today.' Then ask proper interview questions one by one, be warm and human-like.",
    }),
  });

  if (!r.ok) {
    return Response.json({ error: await r.text() }, { status: r.status });
  }

  return Response.json(await r.json());
};
