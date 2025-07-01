"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

type FortuneLifeResponse = {
  hexagram: string;
  description: string;
  personalTraits?: string;
  currentPhase?: string;
  careerGuidance?: string;
  relationshipGuidance?: string;
  growthRecommendations?: string[];
  timing?: string;
  error?: string;
  rawResponse?: string;
};

interface HexagramData {
  hexFont: string;
  english: string;
  pinyin: string;
  number: string;
}

export default function HexagramAnalysisPage() {
  const [fortuneLife, setFortuneLife] = useState<FortuneLifeResponse | null>(
    null
  );
  const [hexagramData, setHexagramData] = useState<HexagramData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // const storedHexagram = localStorage.getItem("currentHexagram");
    const storedFortuneLife = localStorage.getItem("fortuneLife");
    const storedHexagramData = localStorage.getItem("hexagramData");

    if (storedFortuneLife) {
      setFortuneLife(JSON.parse(storedFortuneLife));
    }
    if (storedHexagramData) {
      setHexagramData(JSON.parse(storedHexagramData));
    }
  }, []);

  const generateNewReading = async () => {
    setLoading(true);

    // Generate new hexagram
    const newHexagram = Array.from({ length: 6 }, () =>
      Math.random() < 0.5 ? "yin" : "yang"
    );
    const binary = newHexagram.map((l) => (l === "yang" ? "1" : "0")).join("");

    try {
      const [lifeResponse, hexagramResponse] = await Promise.all([
        fetch("/api/fortune-life", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ binary }),
        }),
        fetch("/api/hexagram-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ binary }),
        }),
      ]);

      if (lifeResponse.ok && hexagramResponse.ok) {
        const lifeData = await lifeResponse.json();
        const hexagramCsvData = await hexagramResponse.json();

        setFortuneLife(lifeData);
        setHexagramData(hexagramCsvData);

        // Store in localStorage for other pages
        localStorage.setItem("currentHexagram", JSON.stringify(newHexagram));
        localStorage.setItem("fortuneLife", JSON.stringify(lifeData));
        localStorage.setItem("hexagramData", JSON.stringify(hexagramCsvData));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8 p-8">
      {/* Navigation */}
      <div className="w-full max-w-4xl flex justify-between items-center">
        <Link
          href="/coin-tossing"
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Coin Tossing
        </Link>

        <h1 className="text-2xl font-bold text-center">
          🔮 Hexagram Life Analysis
        </h1>

        <Link
          href="/city-analysis"
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
        >
          City Analysis
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Hexagram Display */}
      {hexagramData && (
        <div className="text-center p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
          <div
            className="mb-4 font-serif leading-none"
            style={{ fontSize: "120px" }}
          >
            {hexagramData.hexFont}
          </div>

          <h2 className="text-2xl font-semibold text-purple-700">
            {hexagramData.english}
          </h2>

          <p className="text-lg text-purple-600 mt-2">
            {hexagramData.pinyin} • Hexagram {hexagramData.number}
          </p>
        </div>
      )}

      {/* Generate New Reading Button */}
      <button
        onClick={generateNewReading}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        disabled={loading}
      >
        <RotateCcw size={18} />
        {loading ? "Generating New Reading..." : "Generate New Reading"}
      </button>

      {/* Life Analysis */}
      {fortuneLife && (
        <div className="w-full max-w-4xl space-y-6 bg-white rounded-lg border p-8 shadow-lg">
          <h3 className="text-xl font-semibold text-center text-purple-700 mb-6">
            Your Life Path Analysis
          </h3>

          {fortuneLife.personalTraits && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                🌟 Personal Traits
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {fortuneLife.personalTraits}
              </p>
            </div>
          )}

          {fortuneLife.currentPhase && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                🌙 Current Life Phase
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {fortuneLife.currentPhase}
              </p>
            </div>
          )}

          {fortuneLife.careerGuidance && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                💼 Career Guidance
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {fortuneLife.careerGuidance}
              </p>
            </div>
          )}

          {fortuneLife.relationshipGuidance && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                💕 Relationships
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {fortuneLife.relationshipGuidance}
              </p>
            </div>
          )}

          {fortuneLife.growthRecommendations && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                🌱 Growth Recommendations
              </h4>
              <ul className="text-gray-700 space-y-2">
                {fortuneLife.growthRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-purple-400 mr-3 mt-1">•</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fortuneLife.timing && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                ⏰ Timing
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {fortuneLife.timing}
              </p>
            </div>
          )}

          {fortuneLife.error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">
              <strong>Error:</strong> {fortuneLife.error}
            </div>
          )}
        </div>
      )}

      {!fortuneLife && !loading && (
        <div className="w-full max-w-4xl text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            No hexagram analysis available. Generate a new reading or go back to
            coin tossing.
          </p>
          <Link
            href="/coin-tossing"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start Coin Tossing
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="w-full max-w-4xl flex justify-between items-center pt-8 border-t">
        <Link
          href="/coin-tossing"
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Coin Tossing
        </Link>

        <div className="flex gap-4">
          <Link
            href="/city-analysis"
            className="flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            City Analysis
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/video-of-desti"
            className="flex items-center gap-2 px-6 py-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
          >
            Video Journey
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
