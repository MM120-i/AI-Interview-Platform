import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const initFirebaseAdmin = () => {
  const apps = getApps();

  if (!apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      console.warn(
        "Firebase admin missing env vars — skipping init (page will still render, auth will be disabled)"
      );

      return {
        auth: null as unknown as ReturnType<typeof getAuth>,
        db: null as unknown as ReturnType<typeof getFirestore>,
      };
    }

    try {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } catch (e) {
      console.error("Firebase admin init failed:", e);

      return {
        auth: null as unknown as ReturnType<typeof getAuth>,
        db: null as unknown as ReturnType<typeof getFirestore>,
      };
    }
  }

  try {
    return { auth: getAuth(), db: getFirestore() };
  } catch (e) {
    console.error("Firebase admin getAuth/getFirestore failed:", e);
    console.warn("test");

    return {
      auth: null as unknown as ReturnType<typeof getAuth>,
      db: null as unknown as ReturnType<typeof getFirestore>,
    };
  }
};

export const { auth, db } = initFirebaseAdmin();
