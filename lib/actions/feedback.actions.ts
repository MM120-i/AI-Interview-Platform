import "server-only";

import { db } from "@/firebase/admin";

const mapFeedback = (doc: FirebaseFirestore.QueryDocumentSnapshot): Feedback => {
  const data = doc.data();

  return {
    id: doc.id,
    interviewId: String(data.interviewId ?? ""),
    totalScore: Number(data.totalScore ?? 0),
    categoryScores: Array.isArray(data.categoryScores) ? data.categoryScores : [],
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
    areasForImprovement: Array.isArray(data.areasForImprovement)
      ? data.areasForImprovement.map(String)
      : [],
    finalAssessment: String(data.finalAssessment ?? ""),
    createdAt: String(data.createdAt ?? ""),
  };
};

export const getFeedbackByInterviewId = async (
  interviewId: string,
  userId: string
): Promise<Feedback | null> => {
  if (!db) {
    throw new Error("Firebase Admin is not configured");
  }

  const snapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const sorted = snapshot.docs.map(mapFeedback).sort((a, b) => {
    const dateA = Date.parse(a.createdAt) || 0;
    const dateB = Date.parse(b.createdAt) || 0;
    return dateB - dateA;
  });

  return sorted[0] ?? null;
};
