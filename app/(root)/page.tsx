import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const page = () => {
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
    </>
  );
};

export default page;
