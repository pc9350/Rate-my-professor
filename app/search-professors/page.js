"use client";
import { useState, useEffect } from "react";
import DynamicNavbar from "../components/DynamicNavbar";

export default function Professors() {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800">
      <DynamicNavbar />
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8">Professors List</h1>
        {/* Add your professors list component here */}
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
    </div>
  );
}
