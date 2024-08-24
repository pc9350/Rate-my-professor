// import { db } from "../../../firebase"; // Ensure this path is correct
import { db } from "@/firebase";
import { NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { source, professorInfo } = await request.json();

    console.log("Received data:", { source, professorInfo });

    // Store the data in Firestore using the correct method
    await setDoc(doc(db, "professors", source), { professorInfo });

    return NextResponse.json(
      { message: "Professor information stored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error storing professor information:", error);
    return NextResponse.json(
      {
        error: "Failed to store professor information",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
