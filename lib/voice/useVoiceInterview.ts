"use client";

import { useState, useCallback } from "react";

export type VoiceProvider = "openai-realtime" | "vapi";

export const useVoiceInterview = (provider: VoiceProvider = "openai-realtime") => {
  const [status, setStatus] = useState<"IDLE" | "CONNECTING" | "ACTIVE" | "FINISHED">("IDLE");

  const start = useCallback(
    async (questions: string[]) => {
      setStatus("CONNECTING");
      try {
        if (provider === "openai-realtime") {
          const res = await fetch("/api/realtime/session", { method: "POST" });
          if (!res.ok) throw new Error(await res.text());
          const { client_secret } = await res.json();
          // TODO: setup WebRTC with client_secret.value + questions
          // const pc = new RTCPeerConnection(); pc.setRemoteDescription(...)
          console.log("OpenAI Realtime session ready", client_secret, questions.slice(0, 1));
          setStatus("ACTIVE");
        } else {
          // Fallback to Vapi — keep existing logic
          // const vapi = new Vapi(NEXT_PUBLIC_VAPI_WEB_TOKEN); await vapi.start(interviewer)
          console.log("Vapi fallback start with", questions.length, "questions");
          setStatus("ACTIVE");
        }
      } catch (e) {
        console.error("Voice start failed", e);
        setStatus("FINISHED");
      }
    },
    [provider]
  );

  const stop = useCallback(() => setStatus("FINISHED"), []);

  return { status, start, stop };
};
