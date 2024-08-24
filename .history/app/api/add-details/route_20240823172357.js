import { db } from "../../../firebase.js"; // Adjust the path as necessary
import { NextResponse } from "next/server";
import { setDoc, doc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { source, professorInfo } = await request.json();

    console.log("Received data:", { source, professorInfo });

    // Use setDoc to store the data
    await setDoc(doc(db, "professors", source), professorInfo);

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
