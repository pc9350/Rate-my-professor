// Make sure this path is correct

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { source, professorInfo } = req.body;

    // Store in Firestore
    await db.collection("professors").doc(source).set(professorInfo);

    res
      .status(200)
      .json({ message: "Professor information stored successfully" });
  } catch (error) {
    console.error("Error storing professor information:", error);
    res.status(500).json({ error: "Failed to store professor information" });
  }
}
