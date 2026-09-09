"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CALL_STATUS, useVoiceInterview, type VoiceProvider } from "@/lib/voice/useVoiceInterview";
import { useCallback, useState } from "react";

const provider: VoiceProvider =
  process.env.NEXT_PUBIC_VOICE_PROVIDER === "vapi" ? "vapi" : "openai-realtime";

const Agent = ({ userName, questions = [] }: AgentProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((voiceError: Error) => {
    setError(voiceError.message);
  }, []);

  const { status, transcript, audioRef, start, stop } = useVoiceInterview(provider, {
    onError: handleError,
  });

  const isConnecting = status === CALL_STATUS.CONNECTING;
  const isActive = status === CALL_STATUS.ACTIVE;

  const handleStart = () => {
    setError(null);

    void start({
      username: userName,
      questions,
    });
  };

  const lastMessage = transcript.at(-1);

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src={"/ai-avatar.png"}
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isActive && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src={"/user-avatar.png"}
              alt="user avatar"
              width={540}
              height={540}
              className="size-[120] rounded-full object-cover"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {lastMessage && (
        <div className="transcript-border">
          <div className="transcript">
            <p>{lastMessage.content}</p>
          </div>
        </div>
      )}

      <audio ref={audioRef} autoPlay className="hidden" />
      {error && <p className="text-center text-destructive">{error}</p>}

      <div className="flex w-full justify-center">
        {isActive ? (
          <Button type="button" className={"btn-disconnect"} onClick={stop}>
            End Interview
          </Button>
        ) : (
          <Button
            type="button"
            className={"btn-call"}
            onClick={handleStart}
            disabled={isConnecting}
          >
            {isConnecting ? ". . ." : "Start Interview"}
          </Button>
        )}
      </div>
    </>
  );
};

export default Agent;
