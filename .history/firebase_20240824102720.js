// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVnskCoxqQ1PAvSsO6PK2-bZicqrG8CAM",
  authDomain: "flash-83bf7.firebaseapp.com",
  projectId: "flash-83bf7",
  storageBucket: "flash-83bf7.appspot.com",
  messagingSenderId: "467892452175",
  appId: "1:467892452175:web:a1531617265c86306e233a",
  measurementId: "G-01TY96RGQG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
