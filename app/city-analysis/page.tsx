"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  MapPin,
  Compass,
} from "lucide-react";

type FortuneCityResponse = {
  success: boolean;
  direction: string;
  userLocation: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  recommendedCity: {
    name: string;
    state: string;
    latitude: number;
    longitude: number;
  } | null;
  totalCitiesInDirection: number;
  totalCitiesInDatabase: number;
  successfulTableName?: string;
  supabaseError?: string;
  binary: string;
};

interface HexagramData {
  hexFont: string;
  english: string;
  pinyin: string;
  number: string;
}

interface LocationData {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
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

    console.log("🔍 localStorage fortuneCity:", storedFortuneCity);

    if (storedFortuneCity) {
      setFortuneCity(JSON.parse(storedFortuneCity));
    }
    if (storedHexagramData) {
      setHexagramData(JSON.parse(storedHexagramData));
    }
  }, []);

  const getUserLocation = async (): Promise<LocationData> => {
    try {
      // Try to get from localStorage first
      const stored = localStorage.getItem("userLocation");
      if (stored) {
        return JSON.parse(stored);
      }

      // Fallback to IP-based location
      const response = await fetch("/api/get-location");
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.city || "Unknown",
          state: data.region || "Unknown",
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
        };
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }

    // Final fallback
    return {
      city: "New York",
      state: "NY",
      latitude: 40.7128,
      longitude: -74.006,
    };
  };

  const generateNewReading = async () => {
    setLoading(true);

    // Generate new hexagram
    const newHexagram = Array.from({ length: 6 }, () =>
      Math.random() < 0.5 ? "yin" : "yang"
    );
    const binary = newHexagram.map((l) => (l === "yang" ? "1" : "0")).join("");

    try {
      // Get user location
      const location = await getUserLocation();
      console.log(
        "🔍 get user location() function called: location:",
        location
      );

      const [cityResponse, hexagramResponse] = await Promise.all([
        fetch("/api/fortune-city", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            binary,
            direction: fortuneCity?.direction,
            userCity: location.city,
            userState: location.state,
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        }),
        fetch("/api/hexagram-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ binary }),
        }),
      ]);

      console.log("🔍 cityResponse:", cityResponse);
      console.log("🔍 hexagramResponse:", hexagramResponse);

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

      {/* City Analysis - Display Backend Response */}
      {fortuneCity && (
        <div className="w-full max-w-4xl space-y-6 bg-white rounded-lg border p-8 shadow-lg">
          {/* Direction and Success Status */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Compass size={32} className="text-blue-600" />
              <h2 className="text-3xl font-bold text-blue-700">
                Direction: {fortuneCity.direction || "Unknown"}
              </h2>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-teal-400 mx-auto rounded-full"></div>
            <p className="text-sm text-gray-600 mt-2">
              Status: {fortuneCity.success ? "✅ Success" : "❌ Failed"}
            </p>
          </div>

          {/* User Location */}
          {fortuneCity.userLocation && (
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700">
                📍 Your Current Location
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>City:</strong>{" "}
                    {fortuneCity.userLocation.city || "Unknown"}
                  </p>
                  <p>
                    <strong>State:</strong>{" "}
                    {fortuneCity.userLocation.state || "Unknown"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Latitude:</strong>{" "}
                    {fortuneCity.userLocation.latitude || "Unknown"}
                  </p>
                  <p>
                    <strong>Longitude:</strong>{" "}
                    {fortuneCity.userLocation.longitude || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended City */}
          {fortuneCity.recommendedCity ? (
            <div className="space-y-4 bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-600 flex items-center gap-2">
                <MapPin size={20} />
                🌟 Recommended Destiny City
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>City:</strong>{" "}
                    {fortuneCity.recommendedCity.name || "Unknown"}
                  </p>
                  <p>
                    <strong>State:</strong>{" "}
                    {fortuneCity.recommendedCity.state || "Unknown"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Latitude:</strong>{" "}
                    {fortuneCity.recommendedCity.latitude || "Unknown"}
                  </p>
                  <p>
                    <strong>Longitude:</strong>{" "}
                    {fortuneCity.recommendedCity.longitude || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-600">
                ⚠️ No City Found
              </h3>
              <p className="text-gray-700">
                No cities found in the {fortuneCity.direction || "unknown"}{" "}
                direction from your location.
              </p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-700">
                Cities in Direction
              </h4>
              <p className="text-2xl font-bold text-green-600">
                {fortuneCity.totalCitiesInDirection || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-700">
                Total Cities in Database
              </h4>
              <p className="text-2xl font-bold text-purple-600">
                {fortuneCity.totalCitiesInDatabase || 0}
              </p>
            </div>
          </div>

          {/* Technical Info */}
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700">
              🔧 Technical Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Binary:</strong> {fortuneCity.binary || "Unknown"}
                </p>
                <p>
                  <strong>Table Used:</strong>{" "}
                  {fortuneCity.successfulTableName || "None"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Supabase Status:</strong>{" "}
                  {fortuneCity.supabaseError ? "❌ Error" : "✅ Connected"}
                </p>
                {fortuneCity.supabaseError && (
                  <p className="text-red-600 text-xs mt-1">
                    {fortuneCity.supabaseError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Raw Backend Response */}
          <details className="bg-gray-100 p-4 rounded-lg">
            <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
              🔍 Raw Backend Response
            </summary>
            <pre className="text-xs bg-white p-4 rounded border overflow-auto">
              {JSON.stringify(fortuneCity, null, 2)}
            </pre>
          </details>
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
