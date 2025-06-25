import { useState } from "react";
import { InfoIcon } from "lucide-react";
import RemotionPlayer from "@/components/RemotionPlayer";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

const trigramMap: Record<
  string,
  { name: string; symbol: string; direction: string }
> = {
  "111": { name: "Qián", symbol: "☰", direction: "Northwest" },
  "000": { name: "Kūn", symbol: "☷", direction: "Southwest" },
  "011": { name: "Duì", symbol: "☱", direction: "West" },
  "101": { name: "Lí", symbol: "☲", direction: "South" },
  "001": { name: "Zhèn", symbol: "☳", direction: "East" },
  "110": { name: "Xùn", symbol: "☴", direction: "Southeast" },
  "010": { name: "Kǎn", symbol: "☵", direction: "North" },
  "100": { name: "Gèn", symbol: "☶", direction: "Northeast" },
};

type FortuneResponse = {
  selectedCity: string;
  explanation: string;
  fortune: string;
  recommendedPlaces: { name: string; reason: string }[];
  videoUrl?: string;
};

const getHexagramDirections = (hexagram: string[]): string => {
  if (hexagram.length !== 6) return "Unknown";
  const binary = hexagram.map((l) => (l === "yang" ? "1" : "0"));
  const lower = binary.slice(0, 3).reverse().join("");
  const upper = binary.slice(3, 6).reverse().join("");
  const lowerTrigram = trigramMap[lower];
  const upperTrigram = trigramMap[upper];
  if (!lowerTrigram || !upperTrigram) return "Direction unknown";
  return `Lower Trigram: ${lowerTrigram.symbol} (${lowerTrigram.name}) → ${lowerTrigram.direction}\nUpper Trigram: ${upperTrigram.symbol} (${upperTrigram.name}) → ${upperTrigram.direction}`;
};

export default function HomePage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Destiny Lens
        </h1>
        <p className="text-xl text-muted-foreground">
          Your personal Yijing fortune teller
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          Discover your destiny through ancient Chinese wisdom. Cast the coins
          of fate and receive personalized guidance for your life journey.
        </p>
      </div>

      <div className="space-y-4">
        <AuthButton />
        <p className="text-center text-sm text-muted-foreground">
          Sign in to access your personal fortune readings
        </p>
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold mb-4">What you'll discover:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl mb-2">🏙️</div>
            <h4 className="font-medium">City Guidance</h4>
            <p className="text-sm text-muted-foreground">
              Discover which cities align with your energy
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl mb-2">🔮</div>
            <h4 className="font-medium">Life Analysis</h4>
            <p className="text-sm text-muted-foreground">
              Get insights into your personal path
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl mb-2">🎥</div>
            <h4 className="font-medium">Visual Journey</h4>
            <p className="text-sm text-muted-foreground">
              Watch your destiny unfold in a personalized video
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
