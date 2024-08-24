// ProfessorList.js
"use client";
import { useState, useEffect } from "react";

export default function ProfessorList() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const response = await fetch("/api/get-details");
        if (!response.ok) {
          throw new Error("Failed to fetch professors");
        }
        const data = await response.json();
        setProfessors(data);
      } catch (err) {
        console.error("Error fetching professors:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessors();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Professor List</h1>
      {professors.map((professor) => {
        const infoArray = professor.professorInfo.split(", ");
        return (
          <div key={professor.id}>
            <h2>{infoArray[0].split(": ")[1]}</h2>
            {infoArray.map((info, index) => (
              <p key={index}>{info}</p>
            ))}
            <hr />
          </div>
        );
      })}
    </div>
  );
}
