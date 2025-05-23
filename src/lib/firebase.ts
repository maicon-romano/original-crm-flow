
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCx56ood3nMsLVW8kQGfIahPB6DbaKK0d4",
  authDomain: "finsync-23285.firebaseapp.com",
  projectId: "finsync-23285",
  storageBucket: "finsync-23285.firebasestorage.app",
  messagingSenderId: "1037827187530",
  appId: "1:1037827187530:web:2e6d6fe535a2f804ea57b3",
  measurementId: "G-N45NBCW0CR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
