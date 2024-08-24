// pages/api/professors.js
import { db } from "@/firebase";
import { NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";

export default async function handler(req, res) {
  try {
    const professorCollection = collection(db, "professors");
    const professorSnapshot = await getDocs(professorCollection);
    const professorList = professorSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(professorList);
  } catch (error) {
    console.error("Error fetching professors:", error);
    res.status(500).json({ error: "Failed to fetch professors" });
  }
}
