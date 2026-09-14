import { notFound, redirect } from "next/navigation";
import InterviewSession from "@/components/InterviewSession";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/interviews.actions";

type InterviewPageProps = {
  params: Promise<{ id: string }>;
};

const InterviewPage = async ({ params }: InterviewPageProps) => {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const interview = await getInterviewById(id, user.id);

  if (!interview) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1>{interview.role} Interview</h1>
        <p>
          {interview.level} · {interview.type}
        </p>
      </div>

      <InterviewSession
        userName={user.name}
        userId={user.id}
        interviewId={interview.id}
        questions={interview.questions}
      />
    </section>
  );
};

export default InterviewPage;
