
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvhI8C2AzSRg5FCR1jECGj5YhfYsbqycI",
  authDomain: "crm-originaldigital.firebaseapp.com",
  projectId: "crm-originaldigital",
  storageBucket: "crm-originaldigital.appspot.com",
  messagingSenderId: "1043972873648",
  appId: "1:1043972873648:web:2b6dc0092027c1974e4526"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
