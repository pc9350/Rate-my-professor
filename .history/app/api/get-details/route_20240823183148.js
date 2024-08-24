import { db } from "@/firebase";
import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const professorCollection = collection(db, "professors");
    const professorSnapshot = await getDocs(professorCollection);
    const professorList = professorSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(professorList);
  } catch (error) {
    console.error("Error fetching professors:", error);
    return NextResponse.json(
      { error: "Failed to fetch professors" },
      { status: 500 }
    );
  }
}
