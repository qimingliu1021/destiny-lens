"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

type FortuneLifeResponse = {
  hexagram: string;
  description: string;
  citySupport?: string; // How the city supports/hinders growth
  locationAlignment?: string; // Whether location aligns with Yin-Yang/Trigram forces
  suitableCityTypes?: string; // What kinds of cities might suit them
  recommendedCity?: string; // The 1 recommended U.S. city with reasoning
  personalTraits?: string; // Personal analysis fields
  careerGuidance?: string;
  relationshipGuidance?: string;
  currentLifePhase?: string;
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

  // Helper function to safely render any value (string or object)
  const renderSafely = (value: any): string => {
    if (!value) return "";

    // If it's already a string, return it
    if (typeof value === "string") {
      return value;
    }

    // If it's an object with yinYang and trigrams, format it nicely
    if (typeof value === "object" && value.yinYang && value.trigrams) {
      return `Yin-Yang Balance: ${value.yinYang}. Trigram Energy: ${value.trigrams}`;
    }

    // For any other object, convert to readable format
    if (typeof value === "object") {
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${val}`)
        .join(". ");
    }

    // Fallback: convert to string
    return String(value);
  };

  const hasValidContent = (value: any, fallbackText: string): boolean => {
    if (!value) return false;
    const rendered = renderSafely(value);
    return rendered && rendered !== fallbackText && rendered.trim() !== "";
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
            Your Hexagram & Location Analysis
          </h3>

          {/* Energy Alignment */}
          {hasValidContent(
            fortuneLife.locationAlignment,
            "Location alignment analysis not available"
          ) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                ⚊⚋ Energy Alignment
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {renderSafely(fortuneLife.locationAlignment)}
              </p>
            </div>
          )}

          {/* Ideal City Types */}
          {hasValidContent(
            fortuneLife.suitableCityTypes,
            "Suitable city types not determined"
          ) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                🌆 Ideal City Types
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {renderSafely(fortuneLife.suitableCityTypes)}
              </p>
            </div>
          )}

          {/* Recommended Destination */}
          {hasValidContent(
            fortuneLife.recommendedCity,
            "No city recommendation available"
          ) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                ✨ Recommended Destination
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {renderSafely(fortuneLife.recommendedCity)}
              </p>
            </div>
          )}

          {/* City Support */}
          {hasValidContent(
            fortuneLife.citySupport,
            "City analysis not available"
          ) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                🏙️ Current City Impact
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {renderSafely(fortuneLife.citySupport)}
              </p>
            </div>
          )}

          {/* Personal Traits */}
          {hasValidContent(
            fortuneLife.personalTraits,
            "Personal traits analysis not available"
          ) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                🌟 Personal Traits
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {renderSafely(fortuneLife.personalTraits)}
              </p>
            </div>
          )}

          {/* Career Guidance */}
          {hasValidContent(
            fortuneLife.careerGuidance,
            "Career guidance not available"
          ) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                💼 Career Guidance
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {renderSafely(fortuneLife.careerGuidance)}
              </p>
            </div>
          )}

          {/* Current Life Phase */}
          {hasValidContent(
            fortuneLife.currentLifePhase,
            "Life phase analysis not available"
          ) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600 text-lg">
                🌙 Current Life Phase
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {renderSafely(fortuneLife.currentLifePhase)}
              </p>
            </div>
          )}

          {/* Show error if available */}
          {fortuneLife.error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">
              <strong>Error:</strong> {fortuneLife.error}
            </div>
          )}

          {/* Show debug info if needed */}
          {process.env.NODE_ENV === "development" &&
            fortuneLife.rawResponse && (
              <details className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                <summary>Debug: Raw API Response</summary>
                <pre className="whitespace-pre-wrap mt-2">
                  {fortuneLife.rawResponse}
                </pre>
              </details>
            )}

          {/* If no meaningful content is available */}
          {!hasValidContent(
            fortuneLife.locationAlignment,
            "Location alignment analysis not available"
          ) &&
            !hasValidContent(
              fortuneLife.suitableCityTypes,
              "Suitable city types not determined"
            ) &&
            !hasValidContent(
              fortuneLife.recommendedCity,
              "No city recommendation available"
            ) &&
            !hasValidContent(
              fortuneLife.citySupport,
              "City analysis not available"
            ) &&
            !hasValidContent(
              fortuneLife.personalTraits,
              "Personal traits analysis not available"
            ) &&
            !hasValidContent(
              fortuneLife.careerGuidance,
              "Career guidance not available"
            ) &&
            !hasValidContent(
              fortuneLife.currentLifePhase,
              "Life phase analysis not available"
            ) && (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">
                  No analysis available for this hexagram. Try generating a new
                  reading.
                </p>
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
