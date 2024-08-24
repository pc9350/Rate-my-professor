import { db } from "/Users/rakeshpuppala/Desktop/Rate-my-professor/firebase.js"; // Adjust the path as necessary
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { source, professorInfo } = await request.json();

    console.log("Received data:", { source, professorInfo });

    // Store the data in Firestore
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
