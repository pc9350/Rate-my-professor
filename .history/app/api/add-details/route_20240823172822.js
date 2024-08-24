import { db } from "../../../firebase.js"; // Adjust the path as necessary
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { source, professorInfo } = await request.json();

    console.log("Received data:", { source, professorInfo });

    // Use Firestore Admin SDK to store the data
    await db.collection("professors").doc(source).set(professorInfo);

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
