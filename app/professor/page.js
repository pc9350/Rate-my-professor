"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ChatbotInterface from "../components/ChatBotInterface";
import DynamicNavbar from "../components/DynamicNavbar";
import Spline from "@splinetool/react-spline";

export default function Home() {
  const [professorId, setProfessorId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleSubmit = async () => {
    const extractedId = extractProfessorId(professorId);
    if (!extractedId) {
      setError(
        "Invalid URL format. Please enter a valid RateMyProfessors URL."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/professor_details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ professorId: extractedId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const professorInfo = data.professorInfo;
      const feedbacks = data.feedbacks;

      const [department, university] = extractDepartmentAndUniversity(
        professorInfo.department
      );

      const professorInfoString = [
        `Name: ${professorInfo.name || "Unknown"}`,
        `Department: ${department || "Unknown"}`,
        `University: ${university || "Unknown"}`,
        `Overall Rating: ${professorInfo.overallRating || "N/A"}`,
        `Number of Ratings: ${professorInfo.numRatings || "0"}`,
        `Would Take Again: ${professorInfo.wouldTakeAgain || "N/A"}`,
        `Difficulty: ${professorInfo.difficulty || "N/A"}`,
        `Top Tags: ${professorInfo.topTags.join(", ") || "None"}`,
      ].join(", ");

      const feedbacksString = feedbacks
        .map((feedback) =>
          [
            `Course: ${feedback.course || ""}`,
            `Date: ${feedback.date || ""}`,
            `Quality: ${feedback.qualityRating || ""}`,
            `Difficulty: ${feedback.difficultyRating || ""}`,
            `Comments: ${feedback.comments || ""}`,
            `Tags: ${feedback.tags.join(", ") || "None"}`,
          ].join(", ")
        )
        .join("; ");

      await sendToEmbeddingAPI(
        professorId,
        professorInfoString,
        feedbacksString
      );

      console.log("Professor Information:", professorInfoString);
      console.log("Feedbacks:", feedbacksString);
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const extractDepartmentAndUniversity = (departmentInfo) => {
    const parts = departmentInfo.split(" at ");
    const department = parts[0]
      .replace("Professor in the ", "")
      .replace(" department", "");
    const university = parts[1] || "Unknown";
    return [department, university];
  };

  const extractProfessorId = (url) => {
    const match = url.match(/professor\/(\d+)$/);
    return match ? match[1] : null;
  };

  const sendToEmbeddingAPI = async (source, professorInfo, feedbacks) => {
    try {
      const response = await fetch("/api/add-professor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          text: `Professor Information: ${professorInfo}\n\nFeedbacks: ${feedbacks}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Embedding and storage result:", result);

      const professorId = extractProfessorId(source);

      const response2 = await fetch("/api/add-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: professorId,
          professorInfo,
        }),
      });

      if (!response2.ok) {
        const errorData = await response2.json();
        throw new Error(
          `HTTP error! status: ${response2.status}, message: ${errorData.error}, details: ${errorData.details}`
        );
      }

      const result2 = await response.json();
      console.log("Professor information stored:", result2);
    } catch (error) {
      console.error("Error sending data for embedding:", error);
    }
  };

  const handleQuery = async () => {
    if (!userQuery.trim()) {
      setError("Please enter a question.");
      return;
    }

    setIsQuerying(true);
    setError(null);
    try {
      const response = await fetch("/api/get-professor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userQuery }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data);
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 overflow-hidden">
      <DynamicNavbar />
      <div className="container mx-auto px-4 py-20 flex flex-col lg:flex-row justify-between items-center">
        <div className="w-full lg:w-1/2 h-[500px] mb-8 lg:mb-0 relative">
          <div className="absolute inset-0 z-0">
            <Spline scene="https://prod.spline.design/h-MzhlKtinRO8ewm/scene.splinecode" />
          </div>
        </div>

        <div className="w-full lg:w-1/2 lg:pl-8">
          <ChatbotInterface
            professorId={professorId}
            setProfessorId={setProfessorId}
            userQuery={userQuery}
            setUserQuery={setUserQuery}
            handleSubmit={handleSubmit}
            handleQuery={handleQuery}
            isLoading={isLoading}
            isQuerying={isQuerying}
            error={error}
            answer={answer}
          />
        </div>
      </div>
    </div>
  );
}
