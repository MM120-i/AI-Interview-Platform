"use client";

import { getRandomInterviewCover } from "@/lib/utils";
import dayjs from "dayjs";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DisplayTechIcons from "./DisplayTechIcons";

const InterviewCard = ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  const feedback = null as Feedback | null;
  const normalizedTypes = /mix/gi.test(type) ? "Mixed" : "type";
  const [fallbackDate] = useState(() => Date.now());
  const formattedDate = useMemo(
    () => dayjs(feedback?.createdAt || createdAt || fallbackDate).format("MMM D, YYYY"),
    [feedback?.createdAt, createdAt, fallbackDate]
  );

  return (
    <div className="card-border min-h:96 w-90 max-sm:w-full">
      <div className="card-interview">
        <div>
          <div className="absolute top-0 right-0 w-fit rounded-bl-lg bg-light-600 px-4 py-2">
            <p className="badge-text">{normalizedTypes}</p>
          </div>
          <Image
            src={getRandomInterviewCover()}
            alt="cover image"
            width={90}
            height={90}
            className="object-fit size-22.5 rounded-full"
          />
          <h3 className="mt-5 capitalize">{role} Interview</h3>
          <div className="mt-3 flex flex-row gap-5">
            <div className="flex flex-row gap-2">
              <Image src={"/calendar.svg"} alt="calender" width={22} height={22} />
              <p>{formattedDate}</p>
            </div>
            <div className="flex flex-row items-center gap-2">
              <Image src={"/star.svg"} alt="star" width={22} height={22} />
              <p>{feedback?.totalScore || "--"} / 100</p>
            </div>
          </div>
          <p className="mt-5 line-clamp-2">
            {feedback?.finalAssessment || "You have not taken the interview"}
          </p>
        </div>
        <div className="flex flex-row justify-between">
          <p>Tech Icons</p>
          <DisplayTechIcons techStack={techstack} />
          <Button className="btn-primary">
            <Link
              href={feedback ? `/interview/${interviewId}/feedback` : `/interview/${interviewId}`}
            >
              {feedback ? "Check Feedback" : "View Interview"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
