// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAh4q3PP9n2tJ5SaVxtyCCNH5DYqa5X830",
  authDomain: "professor-f36e9.firebaseapp.com",
  projectId: "professor-f36e9",
  storageBucket: "professor-f36e9.appspot.com",
  messagingSenderId: "110725957327",
  appId: "1:110725957327:web:dc4e418100c023c01119ba",
  measurementId: "G-1F5SKEQX03",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default { db };
