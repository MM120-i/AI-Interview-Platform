"use client";

import Vapi from "@vapi-ai/web";
import { useState, useCallback, useRef, useEffect } from "react";

export const CALL_STATUS = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
} as const;

export type CallStatus = (typeof CALL_STATUS)[keyof typeof CALL_STATUS];
export type VoiceProvider = "openai-realtime" | "vapi";

export type TranscriptMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StartOptions = {
  username: string;
  questions: string[];
};

type useVoiceInterviewOptions = {
  onFinished?: (transcript: TranscriptMessage[]) => void;
  onError?: (error: Error) => void;
};

type RealtimeEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  error?: {
    message?: string;
  };
};

export const useVoiceInterview = (
  provider: VoiceProvider = "openai-realtime",
  options: useVoiceInterviewOptions = {}
) => {
  const [status, setStatus] = useState<CallStatus>(CALL_STATUS.INACTIVE);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const onFinishedRef = useRef(options.onFinished);
  const onErrorRef = useRef(options.onError);
  const finishedRef = useRef(false);

  const partialRef = useRef({
    user: "",
    assistant: "",
  });

  useEffect(() => {
    onFinishedRef.current = options.onFinished;
    onErrorRef.current = options.onError;
  }, [options.onFinished, options.onError]);

  const appendTranscript = useCallback((role: "user" | "assistant", content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    const message: TranscriptMessage = {
      id: crypto.randomUUID(),
      role,
      content: trimmedContent,
    };

    transcriptRef.current = [...transcriptRef.current, message];
    setTranscript(transcriptRef.current);
  }, []);

  const handleRealtimeEvent = useCallback(
    (rawEvent: MessageEvent<string>) => {
      const event = JSON.parse(rawEvent.data) as RealtimeEvent;

      if (event.type === "error") {
        throw new Error(event.error?.message ?? "Realtime API error");
      }

      if (event.type === "conversation.item.input_audio_transcription.delta") {
        partialRef.current.user += event.delta ?? "";
        return;
      }

      if (
        event.type === "conversation.item.input_audio_transcription.completed" ||
        event.type === "conversation.item.input_audio_transcription.done"
      ) {
        appendTranscript("user", event.transcript ?? partialRef.current.user);
        partialRef.current.user = "";
        return;
      }

      if (
        event.type === "response.audio_transcript.delta" ||
        event.type === "response.output_audio_transcript.delta"
      ) {
        partialRef.current.assistant += event.delta ?? "";
        return;
      }

      if (
        event.type === "response.audio_transcript.done" ||
        event.type === "response.output_audio_transcript.done"
      ) {
        appendTranscript("assistant", event.transcript ?? partialRef.current.assistant);
        partialRef.current.assistant = "";
      }
    },
    [appendTranscript]
  );

  const finish = useCallback(() => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    setStatus(CALL_STATUS.FINISHED);
    onFinishedRef.current?.(transcriptRef.current);
  }, []);

  const cleanup = useCallback(() => {
    const vapi = vapiRef.current;
    vapiRef.current = null;
    void vapi?.stop();

    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    const peerConnection = peerConnectionRef.current;
    peerConnectionRef.current = null;

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, []);

  const startOpenAI = useCallback(
    async ({ username, questions }: StartOptions) => {
      const tokenResponse = await fetch("/api/realtime/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, questions }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error ?? "Unable to create realtime session");
      }

      const ephemeralToken = tokenData.value ?? tokenData.client.secret?.value;

      if (!ephemeralToken) {
        throw new Error("Realtime session did not return a client token");
      }

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      peerConnection.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          setStatus(CALL_STATUS.ACTIVE);
        }

        if (
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "closed"
        ) {
          cleanup();
          finish();
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaStreamRef.current = mediaStream;
      peerConnection.addTrack(mediaStream.getAudioTracks()[0], mediaStream);

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleRealtimeEvent;

      dataChannel.onopen = () => {
        dataChannel.send(
          JSON.stringify({
            type: "response.create",
          })
        );
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (!offer.sdp) {
        throw new Error("Unable to create WebRTC offer");
      }

      const answerResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-type": "application/sdp",
        },
      });

      if (!answerResponse.ok) {
        throw new Error(await answerResponse.text());
      }

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: await answerResponse.text(),
      });
    },
    [cleanup, finish, handleRealtimeEvent]
  );

  const startVapi = useCallback(async ({ username, questions }: StartOptions) => {
    const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (!token || !assistantId) {
      throw new Error("Vapi evironment variables are missing");
    }

    const vapi = new Vapi(token);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setStatus(CALL_STATUS.ACTIVE));
    vapi.on("call-end", () => {
      cleanup();
      finish();
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript" && message.transactionType === "final") {
        appendTranscript(message.role === "user" ? "user" : "assistant", message.transcript);
      }
    });

    await vapi.start(assistantId, {
      variableValues: {
        username,
        questions: questions.join("\n"),
      },
    });
  }, [appendTranscript, cleanup, finish]);

  const start = useCallback(
    async (startOptions: StartOptions) => {
      if (status === CALL_STATUS.CONNECTING || status === CALL_STATUS.ACTIVE) {
        return;
      }

      cleanup();
      transcriptRef.current = [];
      partialRef.current = { user: "", assistant: "" };
      finishedRef.current = false;
      setTranscript([]);
      setStatus(CALL_STATUS.CONNECTING);

      try {
        if (provider === "vapi") {
          await startVapi(startOptions);
        } else {
          await startOpenAI(startOptions);
        }
      } catch (error) {
        cleanup();
        setStatus(CALL_STATUS.FINISHED);

        const normalizedError = error instanceof Error ? error : new Error("Voice session failed");
        onErrorRef.current?.(normalizedError);
      }
    },
    [cleanup, provider, startOpenAI, startVapi, status]
  );

  const stop = useCallback(() => {
    cleanup();
    finish();
  }, [cleanup, finish]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { status, start, stop, transcript, audioRef };
};
