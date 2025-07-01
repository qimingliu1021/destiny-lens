"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw, MapPin } from "lucide-react";

type FortuneCityResponse = {
  selectedCity: string;
  explanation: string;
  fortune: string;
  recommendedPlaces: { name: string; reason: string }[];
  videoUrl?: string;
};

interface HexagramData {
  hexFont: string;
  english: string;
  pinyin: string;
  number: string;
}

export default function CityAnalysisPage() {
  const [fortuneCity, setFortuneCity] = useState<FortuneCityResponse | null>(
    null
  );
  const [hexagramData, setHexagramData] = useState<HexagramData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedFortuneCity = localStorage.getItem("fortuneCity");
    const storedHexagramData = localStorage.getItem("hexagramData");

    if (storedFortuneCity) {
      setFortuneCity(JSON.parse(storedFortuneCity));
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
      const [cityResponse, hexagramResponse] = await Promise.all([
        fetch("/api/fortune-city", {
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

      if (cityResponse.ok && hexagramResponse.ok) {
        const cityData = await cityResponse.json();
        const hexagramCsvData = await hexagramResponse.json();

        setFortuneCity(cityData);
        setHexagramData(hexagramCsvData);

        // Store in localStorage for other pages
        localStorage.setItem("currentHexagram", JSON.stringify(newHexagram));
        localStorage.setItem("fortuneCity", JSON.stringify(cityData));
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
          href="/hexagram-analysis"
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Hexagram Analysis
        </Link>

        <h1 className="text-2xl font-bold text-center">
          🏙️ Destiny City Analysis
        </h1>

        <Link
          href="/video-of-desti"
          className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
        >
          Video Journey
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Hexagram Display */}
      {hexagramData && (
        <div className="text-center p-6 bg-gradient-to-r from-blue-100 to-teal-100 rounded-lg">
          <div
            className="mb-4 font-serif leading-none"
            style={{ fontSize: "120px" }}
          >
            {hexagramData.hexFont}
          </div>

          <h2 className="text-2xl font-semibold text-blue-700">
            {hexagramData.english}
          </h2>

          <p className="text-lg text-blue-600 mt-2">
            {hexagramData.pinyin} • Hexagram {hexagramData.number}
          </p>
        </div>
      )}

      {/* Generate New Reading Button */}
      <button
        onClick={generateNewReading}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        disabled={loading}
      >
        <RotateCcw size={18} />
        {loading ? "Finding New Destiny City..." : "Find New Destiny City"}
      </button>

      {/* City Analysis */}
      {fortuneCity && (
        <div className="w-full max-w-4xl space-y-6 bg-white rounded-lg border p-8 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-blue-700 mb-4 flex items-center justify-center gap-3">
              <MapPin size={32} />
              {fortuneCity.selectedCity}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-teal-400 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-600">
              🌟 Why This City Calls to You
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {fortuneCity.explanation}
            </p>
          </div>

          {fortuneCity.fortune && (
            <div className="space-y-4 bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-600">
                🔮 Your Fortune in This City
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {fortuneCity.fortune}
              </p>
            </div>
          )}

          {fortuneCity.recommendedPlaces &&
            fortuneCity.recommendedPlaces.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-600">
                  📍 Sacred Places to Visit
                </h3>
                <div className="grid gap-4">
                  {fortuneCity.recommendedPlaces.map((place, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-blue-400 pl-6 py-4 bg-gradient-to-r from-blue-50 to-transparent rounded-r-lg"
                    >
                      <h4 className="font-semibold text-blue-800 text-lg mb-2">
                        {place.name}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {place.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {!fortuneCity && !loading && (
        <div className="w-full max-w-4xl text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            No city analysis available. Generate a new reading or start from
            coin tossing.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/coin-tossing"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Coin Tossing
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={generateNewReading}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RotateCcw size={16} />
              Generate City Reading
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="w-full max-w-4xl flex justify-between items-center pt-8 border-t">
        <Link
          href="/hexagram-analysis"
          className="flex items-center gap-2 px-6 py-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Hexagram Analysis
        </Link>

        <div className="flex gap-4">
          <Link
            href="/coin-tossing"
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Coin Tossing
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
