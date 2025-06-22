"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InfoIcon } from "lucide-react";

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
  recommendedPlaces: { name: string; reason: string }[];
};

export default function ProtectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hexagram, setHexagram] = useState<string[]>([]);
  const [binary, setBinary] = useState<string>("");
  const [fortune, setFortune] = useState<FortuneResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLines, setShowLines] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/auth/login");
      } else {
        setUser(data.user);
      }
    };
    getUser();
  }, [router]);

  const flipCoins = async () => {
    setFortune(null);
    setShowLines(false);
    setHexagram([]);
    setLoading(true);

    const generated: string[] = [];
    for (let i = 0; i < 6; i++) {
      generated.push("flipping");
      setHexagram([...generated]);
      await new Promise((res) => setTimeout(res, 200));
      generated[i] = Math.random() < 0.5 ? "yin" : "yang";
      setHexagram([...generated]);
    }

    const binaryStr = generated.map((l) => (l === "yang" ? "1" : "0")).join("");
    setBinary(binaryStr);

    try {
      const res = await fetch("/api/fortune", {
        method: "POST",
        body: JSON.stringify({ binary: binaryStr }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setShowLines(true);
      setFortune(data);
    } catch (e) {
      setFortune({
        selectedCity: "Unknown",
        explanation: "Connection failed.",
        recommendedPlaces: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getHexagramDirections = () => {
    if (hexagram.length !== 6) return "Unknown";
    const bin = hexagram.map((l) => (l === "yang" ? "1" : "0"));
    const lower = bin.slice(0, 3).reverse().join("");
    const upper = bin.slice(3, 6).reverse().join("");
    const lowerTrigram = trigramMap[lower];
    const upperTrigram = trigramMap[upper];
    if (!lowerTrigram || !upperTrigram) return "Direction unknown";
    return `☰ ${lowerTrigram.name} → ${lowerTrigram.direction}\n☰ ${upperTrigram.name} → ${upperTrigram.direction}`;
  };

  const renderCoin = (line: string, index: number) => (
    <div
      key={index}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow transition-all duration-500 ${
        line === "flipping"
          ? "bg-accent animate-spin-slow"
          : "bg-yellow-400 text-black"
      }`}
    >
      {line === "flipping" ? "🪙" : line === "yang" ? "⚊" : "⚋"}
    </div>
  );

  const renderHexagramLine = (line: string, index: number) => (
    <div
      key={index}
      className={`w-24 h-2 bg-black relative rounded-full transition-opacity duration-700 delay-${
        index * 100
      }`}
    >
      {line === "yin" && (
        <div className="absolute inset-y-0 left-1/2 w-6 h-full bg-background -translate-x-1/2" />
      )}
    </div>
  );

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8 p-8 font-serif">
      <div className="bg-accent text-sm p-3 px-5 rounded-md text-accent-foreground flex gap-3 items-center border border-border">
        <InfoIcon size={16} strokeWidth={2} />
        Welcome to Destiny Lens – your personal Yijing fortune teller.
      </div>

      {user && (
        <div className="w-full max-w-md bg-card rounded-xl border border-primary p-6 shadow space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary tracking-widest">
            🧧 Your Destiny Hexagram
          </h2>

          <button
            onClick={flipCoins}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-full shadow hover:bg-primary/90 transition-all font-semibold"
            disabled={loading}
          >
            {loading ? "Consulting..." : "🎴 Flip the Coins of Fate"}
          </button>

          {hexagram.length > 0 && (
            <>
              <div className="flex justify-center gap-2">
                {hexagram.map(renderCoin)}
              </div>

              {showLines && (
                <div className="flex flex-col-reverse items-center gap-1 mt-4">
                  {hexagram.map(renderHexagramLine).reverse()}
                </div>
              )}
            </>
          )}

          {fortune && (
            <div className="pt-4 space-y-6 text-sm text-left">
              <h3 className="text-lg font-bold text-primary text-center">
                ✨ {fortune.selectedCity}
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {fortune.explanation}
              </p>
              <ul className="space-y-3">
                {fortune.recommendedPlaces?.map((place, idx) => (
                  <li key={idx} className="border-l-4 border-primary pl-3">
                    <strong>{place.name}:</strong> {place.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
