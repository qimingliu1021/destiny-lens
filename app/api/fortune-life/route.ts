import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import path from "path";

interface HexagramRecord {
  binary: string;
  english: string;
  symbolic: string;
  hex_font: string;
  trigram_above: string;
  trigram_below: string;
  [key: string]: string;
}

interface FortuneLifeResponse {
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
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const {
      binary,
      userCity = "Unknown",
      userState = "Unknown",
      latitude,
      longitude,
    } = body;

    // Validate required inputs
    if (!binary || typeof binary !== "string" || binary.length !== 6) {
      return NextResponse.json(
        {
          error: "Invalid binary input. Must be a 6-character binary string.",
        },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Process hexagram data
    const reversedBinary = binary.split("").reverse().join("");
    const filePath = path.join(process.cwd(), "public", "yijing_fixed.csv");

    let csvRaw: string;
    try {
      csvRaw = await readFile(filePath, "utf-8");
    } catch (fileError) {
      console.error("Error reading CSV file:", fileError);
      return NextResponse.json(
        {
          error: "Unable to read hexagram data",
        },
        { status: 500 }
      );
    }

    const records: HexagramRecord[] = parse(csvRaw, {
      columns: true,
      skip_empty_lines: true,
    });

    const match = records.find((row) => row.binary === reversedBinary);
    if (!match) {
      return NextResponse.json(
        {
          error: "Hexagram not found for binary: " + reversedBinary,
        },
        { status: 404 }
      );
    }

    const title = match.english;
    const description = match.symbolic;

    // Generate line interpretations
    const lineDescriptions = [
      "Line 1 (Foundation): The beginning of change; initial conditions.",
      "Line 2 (Field/Response): The appropriate response to external action.",
      "Line 3 (Decision Point): Danger of excess or premature action.",
      "Line 4 (Transition): Movement toward resolution, but still unstable.",
      "Line 5 (Ruler/Guide): Power in alignment; effective leadership.",
      "Line 6 (Completion): End of cycle; transcendence or decay.",
    ];

    const linesWithMeaning = reversedBinary
      .split("")
      .map(
        (bit, i) =>
          `${lineDescriptions[i]} → ${
            bit === "1" ? "Yang (solid)" : "Yin (broken)"
          }`
      )
      .join("\n");

    // Create location context
    const locationContext =
      latitude && longitude
        ? `at coordinates ${latitude}, ${longitude}`
        : "location not specified";

    // Enhanced Claude prompt
    const prompt = `A user in ${userCity}, ${userState} has drawn Hexagram ${title} (${description}).
    Their current geolocation is: ${latitude}, ${longitude}.
    
    Their hexagram lines are interpreted as:
    ${linesWithMeaning}
    
    Please analyze the user's **current life** in relation to their **physical environment** and city context.
    
    Respond in JSON with the following:
    - How the city they're in is supporting or hindering their personal growth
    - Whether their location aligns with their Yin-Yang and Trigram forces
    - What kinds of cities (nature-rich, fast-paced, intellectual, spiritual, etc.) might better suit them
    - Recommend 1 real U.S. cities with poetic but concrete reasoning (e.g., 'Seattle awakens your water energy while grounding your fire ambitions.')
    - Include the rest of the personal analysis fields (traits, career, etc.) in light of this context`;

    // Call Claude API
    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const result = await claudeResponse.json();
    const responseText = result?.content?.[0]?.text || "";

    if (!responseText) {
      throw new Error("Empty response from Claude API");
    }

    // Parse Claude's JSON response
    let parsedAnalysis;
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      parsedAnalysis = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      console.error("Raw response:", responseText);

      // Return fallback response with partial data
      return NextResponse.json({
        hexagram: title,
        description,
        error: "Unable to parse AI analysis",
        rawResponse: responseText.substring(0, 300),
        citySupport: "City analysis temporarily unavailable.",
        locationAlignment:
          "Location alignment analysis temporarily unavailable.",
        suitableCityTypes: "Suitable city analysis temporarily unavailable.",
        recommendedCity: "City recommendation temporarily unavailable.",
        personalTraits: "Personal traits analysis temporarily unavailable.",
        careerGuidance: "Career guidance temporarily unavailable.",
        relationshipGuidance: "Relationship guidance temporarily unavailable.",
        currentLifePhase: "Life phase analysis temporarily unavailable.",
      } as FortuneLifeResponse);
    }

    // Validate parsed response structure
    const finalResponse: FortuneLifeResponse = {
      hexagram: title,
      description,
      citySupport:
        parsedAnalysis.citySupport ||
        parsedAnalysis.personalGrowth ||
        "City analysis not available",
      locationAlignment:
        parsedAnalysis.locationAlignment ||
        parsedAnalysis.yinYangAlignment ||
        "Location alignment analysis not available",
      suitableCityTypes:
        parsedAnalysis.suitableCityTypes ||
        parsedAnalysis.cityTypes ||
        "Suitable city types not determined",
      recommendedCity:
        parsedAnalysis.recommendedCity ||
        parsedAnalysis.cityRecommendation ||
        "No city recommendation available",
      personalTraits:
        parsedAnalysis.personalTraits ||
        parsedAnalysis.traits ||
        "Personal traits analysis not available",
      careerGuidance:
        parsedAnalysis.careerGuidance ||
        parsedAnalysis.career ||
        "Career guidance not available",
      relationshipGuidance:
        parsedAnalysis.relationshipGuidance ||
        parsedAnalysis.relationships ||
        "Relationship guidance not available",
      currentLifePhase:
        parsedAnalysis.currentLifePhase ||
        parsedAnalysis.lifePhase ||
        "Life phase analysis not available",
    };

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("Fortune life API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
