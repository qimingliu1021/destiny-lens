"use client";

import { useState } from "react";
import { InfoIcon } from "lucide-react";
import RemotionPlayer from "@/components/RemotionPlayer";

type FortuneCityResponse = {
  selectedCity: string;
  explanation: string;
  fortune: string;
  recommendedPlaces: { name: string; reason: string }[];
  videoUrl?: string;
};

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

export default function CoinTossingPage() {
  const [hexagram, setHexagram] = useState<string[]>([]);
  const [fortuneCity, setFortuneCity] = useState<FortuneCityResponse | null>(
    null
  );
  const [fortuneLife, setFortuneLife] = useState<FortuneLifeResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [hexagramData, setHexagramData] = useState<HexagramData | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const renderCoin = (line: string, index: number) => (
    <div
      key={index}
      className={`relative w-12 h-12 rounded-full shadow-md text-xl font-bold transition-all duration-700 flex items-center justify-center ${
        loading
          ? "bg-gray-300 animate-spin-slow"
          : `${
              line === "yang"
                ? "bg-yellow-400 text-black"
                : "bg-purple-500 text-white"
            } animate-bounce-slight`
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center text-2xl">
          🪙
        </span>
      )}
      {!loading && (line === "yang" ? "⚊" : "⚋")}
    </div>
  );

  const flipCoins = async () => {
    setFortuneCity(null);
    setFortuneLife(null);
    setImageUrls([]);
    setLoading(true);
    setHexagramData(null);

    const newHexagram = Array.from({ length: 6 }, () =>
      Math.random() < 0.5 ? "yin" : "yang"
    );
    console.log("newHexagram", newHexagram);
    setHexagram(newHexagram);

    const binary = newHexagram.map((l) => (l === "yang" ? "1" : "0")).join("");

    try {
      // Call all APIs including image fetching
      const [cityResponse, lifeResponse, hexagramResponse] = await Promise.all([
        fetch("/api/fortune-city", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ binary }),
        }),
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

      if (cityResponse.ok && lifeResponse.ok && hexagramResponse.ok) {
        const cityData = await cityResponse.json();
        const lifeData = await lifeResponse.json();
        const hexagramCsvData = await hexagramResponse.json();

        setFortuneCity(cityData);
        setFortuneLife(lifeData);
        setHexagramData(hexagramCsvData);

        // Fetch images after getting city data
        const imageResponse = await fetch("/api/image-fetching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ binary }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          setImageUrls(imageData.imageUrls || []);
          console.log("🖼️ Image URLs ready:", imageData.imageUrls);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8 p-8">
      <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
        <InfoIcon size={16} strokeWidth={2} />
        Welcome to Destiny Lens – your personal Yijing fortune teller.
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Your Destiny Journey
        </h3>
      </div>

      <div className="w-full max-w-md bg-background rounded-lg border p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Your Destiny Hexagram</h2>
        <button
          onClick={flipCoins}
          className="mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-5 py-2 rounded-xl shadow-lg shadow-purple-500/40 hover:shadow-pink-500/50 transition-all duration-300 ease-in-out font-semibold tracking-wider"
          disabled={loading}
        >
          {loading ? "Consulting the Yijing..." : "Flip the Coins of Fate"}
        </button>

        {hexagramData && (
          <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg mb-6">
            <div
              className="mb-4 font-serif leading-none"
              style={{ fontSize: "150px" }}
            >
              {hexagramData.hexFont}
            </div>

            <h3 className="text-xl font-semibold text-purple-700">
              {hexagramData.english}
            </h3>

            <p className="text-sm text-purple-600 mt-2">
              {hexagramData.pinyin} • Hexagram {hexagramData.number}
            </p>
          </div>
        )}

        {hexagram.length > 0 && (
          <div className="text-center mb-6">
            <div className="grid grid-cols-6 gap-2 justify-center mb-4">
              {hexagram.map((line, index) => renderCoin(line, index))}
            </div>
          </div>
        )}
      </div>

      {fortuneCity && fortuneLife && (
        <div className="w-full max-w-4xl space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">
              🔮 Life Analysis: {fortuneLife.hexagram}
            </h3>

            {fortuneLife.personalTraits && (
              <div>
                <h4 className="font-medium text-purple-600 mb-1">
                  Personal Traits
                </h4>
                <p className="text-sm text-muted-foreground">
                  {fortuneLife.personalTraits}
                </p>
              </div>
            )}

            {fortuneLife.currentPhase && (
              <div>
                <h4 className="font-medium text-purple-600 mb-1">
                  Current Life Phase
                </h4>
                <p className="text-sm text-muted-foreground">
                  {fortuneLife.currentPhase}
                </p>
              </div>
            )}

            {fortuneLife.careerGuidance && (
              <div>
                <h4 className="font-medium text-purple-600 mb-1">
                  Career Guidance
                </h4>
                <p className="text-sm text-muted-foreground">
                  {fortuneLife.careerGuidance}
                </p>
              </div>
            )}

            {fortuneLife.relationshipGuidance && (
              <div>
                <h4 className="font-medium text-purple-600 mb-1">
                  Relationships
                </h4>
                <p className="text-sm text-muted-foreground">
                  {fortuneLife.relationshipGuidance}
                </p>
              </div>
            )}

            {fortuneLife.growthRecommendations && (
              <div>
                <h4 className="font-medium text-purple-600 mb-1">
                  Growth Recommendations
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {fortuneLife.growthRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-purple-400 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {fortuneLife.timing && (
              <div>
                <h4 className="font-medium text-purple-600 mb-1">Timing</h4>
                <p className="text-sm text-muted-foreground">
                  {fortuneLife.timing}
                </p>
              </div>
            )}

            {fortuneLife.error && (
              <div className="text-red-600 text-sm">
                <strong>Error:</strong> {fortuneLife.error}
              </div>
            )}

            {fortuneLife.rawResponse && (
              <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                <strong>Raw Response:</strong>
                <pre className="whitespace-pre-wrap">
                  {fortuneLife.rawResponse.substring(0, 200)}...
                </pre>
              </div>
            )}
          </div>

          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-center mb-2">
              ✨ {fortuneCity.selectedCity}
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line mt-2">
              {fortuneCity.explanation}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {fortuneCity.recommendedPlaces?.map((place, idx) => (
                <li key={idx} className="border-l-4 border-purple-400 pl-3">
                  <strong>{place.name}:</strong> {place.reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Your Destiny Journey
            </h3>
            <div className="w-full flex justify-center">
              <RemotionPlayer imageUrls={imageUrls} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
