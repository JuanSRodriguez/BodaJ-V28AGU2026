import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgso9pk_1JSigO4QFoildaN27nKdssKIE",
  authDomain: "temporaljv-aa2e2.firebaseapp.com",
  projectId: "temporaljv-aa2e2",
  storageBucket: "temporaljv-aa2e2.firebasestorage.app",
  messagingSenderId: "760406011353",
  appId: "1:760406011353:web:040f0d372b7e0096fefdc8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
