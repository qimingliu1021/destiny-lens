import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import path from "path";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface HexagramRecord {
  hex: string;
  hex_font: string;
  binary: string;
  english: string;
  od: string;
  pinyin: string;
  trad_chinese: string;
  above: string;
  below: string;
  symbolic: string;
  image: string;
  judgment: string;
  lines: string;
}

// Complete Trigram definitions for all 8 trigrams
const trigramMap: Record<
  string,
  { name: string; symbol: string; direction: string; element: string }
> = {
  "111": {
    name: "Qián",
    symbol: "☰",
    direction: "Northwest",
    element: "Heaven",
  },
  "000": {
    name: "Kūn",
    symbol: "☷",
    direction: "Southwest",
    element: "Earth",
  },
  "011": {
    name: "Duì",
    symbol: "☱",
    direction: "West",
    element: "Lake",
  },
  "101": {
    name: "Lí",
    symbol: "☲",
    direction: "South",
    element: "Fire",
  },
  "001": {
    name: "Zhèn",
    symbol: "☳",
    direction: "East",
    element: "Thunder",
  },
  "110": {
    name: "Xùn",
    symbol: "☴",
    direction: "Southeast",
    element: "Wind",
  },
  "010": {
    name: "Kǎn",
    symbol: "☵",
    direction: "North",
    element: "Water",
  },
  "100": {
    name: "Gèn",
    symbol: "☶",
    direction: "Northeast",
    element: "Mountain",
  },
};

const cityMap: Record<string, string[]> = {
  North: ["Seattle", "Portland", "Vancouver", "Minneapolis", "Detroit"],
  Northeast: ["Boston", "New York", "Philadelphia", "Montreal", "Toronto"],
  East: ["New York", "Boston", "Miami", "Atlanta", "Washington DC"],
  Southeast: ["Miami", "New Orleans", "Atlanta", "Charleston", "Nashville"],
  South: ["Los Angeles", "San Diego", "Phoenix", "Houston", "Austin"],
  Southwest: ["Los Angeles", "Phoenix", "Las Vegas", "Denver", "Albuquerque"],
  West: ["San Francisco", "Los Angeles", "Seattle", "Portland", "Las Vegas"],
  Northwest: ["Seattle", "Portland", "Vancouver", "Spokane", "Boise"],
};

export async function POST(req: NextRequest) {
  try {
    const { binary } = await req.json();

    if (!binary || binary.length !== 6) {
      return NextResponse.json(
        { error: "Invalid binary input" },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Read CSV and find hexagram
    const filePath = path.join(process.cwd(), "public", "yijing_fixed.csv");
    const csvRaw = await readFile(filePath, "utf-8");
    const records: HexagramRecord[] = parse(csvRaw, {
      columns: true,
      skip_empty_lines: true,
    });

    const reversedBinary = binary.split("").reverse().join("");
    const match = records.find((row) => row.binary === reversedBinary);

    if (!match) {
      return NextResponse.json(
        { error: "Hexagram not found" },
        { status: 404 }
      );
    }

    const title = match.english;
    const description = match.symbolic;

    // Get trigrams and direction
    const direction = trigramMap[binary]?.direction || "North";
    const cities = cityMap[direction] || cityMap["North"];

    const cityText = cities.map((city, i) => `${i + 1}. ${city}`).join("\n");
    const directionText = `The upper trigram points toward the ${direction} direction.`;

    // Line analysis
    const lineDescriptions = [
      "Line 1 (Foundation): The beginning of change; initial conditions.",
      "Line 2 (Field/Response): The appropriate response to external action.",
      "Line 3 (Decision Point): Danger of excess or premature action.",
      "Line 4 (Transition): Movement toward resolution, but still unstable.",
      "Line 5 (Ruler/Guide): Power in alignment; effective leadership.",
      "Line 6 (Completion): End of cycle; transcendence or decay.",
    ];

    const linesWithMeaning = binary
      .split("")
      .map(
        (bit: string, i: number) =>
          `${lineDescriptions[i]} ${
            bit === "1" ? "Yang (solid)" : "Yin (broken)"
          }`
      )
      .join("\n");

    // Claude prompt for city recommendations
    const prompt = `A user has drawn Hexagram "${title}" (${description})

${linesWithMeaning}

${directionText}

Here are some cities in the ${direction} direction near their location:
${cityText}

Pick one city and explain why it suits them in realistic terms. Recommend 3–5 specific places they should explore there. Respond in JSON format with this structure:
{
  "selectedCity": "City Name",
  "explanation": "Why this city suits them",
  "recommendedPlaces": [
    {"name": "Place Name", "reason": "Why this place"}
  ]
}`;

    const claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 600,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const result = await claudeRes.json();
    const parsed = JSON.parse(result?.content?.[0]?.text || "{}");

    return NextResponse.json({
      hexagram: title,
      direction,
      ...parsed,
    });
  } catch (error) {
    console.error("Fortune city error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
