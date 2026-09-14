import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getFeedbackByInterviewId } from "@/lib/actions/feedback.actions";
import { getInterviewById } from "@/lib/actions/interviews.actions";

type FeedbackPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const interview = await getInterviewById(id, user.id);

  if (!interview) {
    notFound();
  }

  const feedback = await getFeedbackByInterviewId(id, user.id);

  if (!feedback) {
    return (
      <section className="section-feedback">
        <h2>No feedback yet</h2>
        <p>Complete the interview first, then feedback will appear here.</p>
        <div className="buttons">
          <Button asChild className="btn-primary">
            <Link href={`/interview/${interview.id}`}>Back to interview</Link>
          </Button>
          <Button asChild className="btn-secondary">
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-feedback">
      <div className="flex flex-col gap-2 text-center">
        <h2>
          Feedback for {interview.role} Interview
        </h2>
        <p>
          {interview.level} · {interview.type}
        </p>
        <p className="text-2xl font-bold">Overall score: {feedback.totalScore} / 100</p>
      </div>

      <div className="flex flex-col gap-4">
        <h3>Category scores</h3>
        {feedback.categoryScores.map((category) => (
          <div key={category.name} className="card flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{category.name}</p>
              <p className="font-bold">{category.score} / 100</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-dark-200">
              <div
                className="h-full rounded-full bg-primary-200"
                style={{ width: `${Math.min(100, Math.max(0, category.score))}%` }}
              />
            </div>
            <p className="text-sm text-light-100">{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3>Strengths</h3>
        <ul>
          {feedback.strengths.map((strength, index) => (
            <li key={`${strength}-${index}`}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h3>Areas for improvement</h3>
        <ul>
          {feedback.areasForImprovement.map((area, index) => (
            <li key={`${area}-${index}`}>{area}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h3>Final assessment</h3>
        <p>{feedback.finalAssessment}</p>
      </div>

      <div className="buttons">
        <Button asChild className="btn-secondary">
          <Link href="/">Back to dashboard</Link>
        </Button>
        <Button asChild className="btn-primary">
          <Link href="/interview">Take another interview</Link>
        </Button>
      </div>
    </section>
  );
}
