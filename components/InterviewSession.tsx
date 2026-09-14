"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import Agent from "@/components/Agent";

type InterviewSessionProps = {
  userName: string;
  userId: string;
  interviewId: string;
  questions: string[];
};

export default function InterviewSession({
  userName,
  userId,
  interviewId,
  questions,
}: InterviewSessionProps) {
  const router = useRouter();
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const handleFinished = useCallback(
    async (transcript: { role: "user" | "assistant"; content: string }[]) => {
      if (transcript.length === 0) {
        toast.error("No interview transcript was captured");
        return;
      }

      setIsGeneratingFeedback(true);

      try {
        const response = await fetch("/api/feedback/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ interviewId, transcript }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to generate feedback");
        }

        toast.success("Feedback is ready");
        router.push(`/interview/${interviewId}/feedback`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      } finally {
        setIsGeneratingFeedback(false);
      }
    },
    [interviewId, router]
  );

  return (
    <div className="flex flex-col gap-4">
      <Agent
        userName={userName}
        userId={userId}
        interviewId={interviewId}
        type="interview"
        questions={questions}
        onFinished={(transcript) => {
          void handleFinished(transcript);
        }}
      />
      {isGeneratingFeedback && (
        <p className="text-center text-sm text-muted-foreground">
          Generating your feedback, please wait...
        </p>
      )}
    </div>
  );
}
