import { db } from "../../../firebase.js"; // Adjust the path as necessary
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { source, professorInfo } = await request.json();

    // Store in Firestore
    await db.collection("professors").doc(source).set(professorInfo);

    return NextResponse.json(
      { message: "Professor information stored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error storing professor information:", error);
    return NextResponse.json(
      { error: "Failed to store professor information" },
      { status: 500 }
    );
  }
}
