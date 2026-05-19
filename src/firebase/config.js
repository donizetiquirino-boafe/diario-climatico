import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQ6KC0RAvA0xaxGqCYVRX3f2QRw3FE7ZU",
  authDomain: "diario-climatico.firebaseapp.com",
  projectId: "diario-climatico",
  storageBucket: "diario-climatico.firebasestorage.app",
  messagingSenderId: "164021604639",
  appId: "1:164021604639:web:f4363e4e1aa2a2de15602a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
