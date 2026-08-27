import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBK0jwccrIkJHGKXOE2YWdmMI2_L_dNez8",
  authDomain: "preppilot-eb184.firebaseapp.com",
  projectId: "preppilot-eb184",
  storageBucket: "preppilot-eb184.firebasestorage.app",
  messagingSenderId: "854295219534",
  appId: "1:854295219534:web:51764e249b30d6155a221f",
  measurementId: "G-5Y7B7CZ771",
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
