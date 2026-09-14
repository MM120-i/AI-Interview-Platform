import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import InterviewCard from "@/components/InterviewCard";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewByUserId } from "@/lib/actions/interviews.actions";

const page = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const interviews = await getInterviewByUserId(user.id);

  return (
    <>
      <section className="card-cts">
        <div className="flex max-w-lg flex-col gap-6">
          <h2>Get Interview-Ready with AI-powered Practice & Feedback</h2>
          <p className="text-lg">Practice on real interview questions & get instant feedback</p>
          <Button asChild className={"btn-primary max-sm:w-full"}>
            <Link href={"/interview"}>Start an Interview</Link>
          </Button>
        </div>

        <Image
          src={"/robot.png"}
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
          style={{ width: "auto", height: "auto" }}
        />
      </section>

      <section className="mt-8 flex flex-col gap-6">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {interviews.length === 0 ? (
            <p>You have not taken any interviews yet.</p>
          ) : (
            interviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interviewId={interview.id}
                userId={interview.userId}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-8">
        <h2>Take an interview</h2>
        <div className="interviews-section">
          {/* {dummyInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interviewId={interview.id}
              userId={interview.userId}
              role={interview.role}
              type={interview.type}
              techstack={interview.techstack}
              createdAt={interview.createdAt}
            />
          ))} */}
        </div>
      </section>
    </>
  );
};

export default page;
