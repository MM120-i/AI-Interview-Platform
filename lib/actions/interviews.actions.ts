import "server-only";

import { db } from "@/firebase/admin";

const mapInterview = (doc: FirebaseFirestore.QueryDocumentSnapshot): Interview => {
  const data = doc.data();

  return {
    id: doc.id,
    role: String(data.role ?? ""),
    level: String(data.level ?? ""),
    type: String(data.type ?? ""),
    questions: Array.isArray(data.questions) ? data.questions.map(String) : [],
    techstack: Array.isArray(data.techstack) ? data.techstack.map(String) : [],
    createdAt: String(data.createdAt ?? ""),
    userId: String(data.userid ?? ""),
    finalized: Boolean(data.finalized),
  };
};

export const getInterviewByUserId = async (userId: string): Promise<Interview[]> => {
  if (!db) {
    throw new Error("Firebase Admin is not configured");
  }

  const snapshot = await db
    .collection("interviews")
    .where("userid", "==", userId)
    .get();

  return snapshot.docs
    .map(mapInterview)
    .sort((a, b) => {
      const dateA = Date.parse(a.createdAt) || 0;
      const dateB = Date.parse(b.createdAt) || 0;
      return dateB - dateA;
    });
};

export const getInterviewById = async (
  interviewId: string,
  userId: string
): Promise<Interview | null> => {
  if (!db) {
    throw new Error("Firebase Admin is not configured");
  }

  const document = await db.collection("interviews").doc(interviewId).get();

  if (!document.exists) {
    return null;
  }

  const data = document.data();

  if (data?.userid !== userId) {
    return null;
  }

  return mapInterview(document as FirebaseFirestore.QueryDocumentSnapshot);
};
