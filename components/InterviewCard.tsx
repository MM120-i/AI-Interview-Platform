"use client";

import { getRandomInterviewCover } from "@/lib/utils";
import dayjs from "dayjs";
import Image from "next/image";
import { useMemo, useState } from "react";

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
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
