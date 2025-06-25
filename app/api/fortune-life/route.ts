import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import path from "path";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: NextRequest) {
  const { binary } = await req.json();
  if (!binary || typeof binary !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const reversedBinary = binary.split("").reverse().join("");
  const filePath = path.join(process.cwd(), "public", "yijing_fixed.csv");
  const csvRaw = await readFile(filePath, "utf-8");
  const records: any[] = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
  });
  const match = records.find((row) => row.binary === reversedBinary);

  if (!match) {
    return NextResponse.json({ error: "Hexagram not found" }, { status: 404 });
  }

  const title = match.english;
  const description = match.symbolic;

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

  try {
    // Claude prompt for life analysis
    const prompt = `A user has drawn Hexagram ${title} (${description}) ${linesWithMeaning}
Based on this I Ching reading, provide a comprehensive life analysis. Focus on:

- Personal characteristics and strengths
- Current life phase and what to expect  
- Career and relationship guidance
- Personal growth recommendations
- Timing and when to take action

Please provide detailed, insightful analysis that goes beyond surface-level interpretations. Each section should be substantial and meaningful.

Respond in JSON format with this structure:
{
  "personalTraits": "A comprehensive description of their character, strengths, and natural tendencies. This should be multiple sentences providing deep insight into their personality.",
  "currentPhase": "A detailed explanation of what phase of life they're in, what it means, and what they can expect. Include the significance of this timing.",
  "careerGuidance": "Comprehensive career-related insights and advice. Include specific guidance about work approaches, leadership style, and professional development.",
  "relationshipGuidance": "Detailed relationship and social insights covering family, friendships, romantic relationships, and social interactions.",
  "growthRecommendations": [
    "Specific personal development suggestion with detailed explanation",
    "Another growth area with actionable advice",
    "Additional recommendation for self-improvement"
  ],
  "timing": "Detailed guidance about when to take action, make changes, or wait. Include seasonal or cyclical timing recommendations."
}`;

    // console.log("prompt is in fortune-life is:\n", prompt);
    const claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1200,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const result = await claudeRes.json();
    // console.log("result is in fortune-life is:\n", result);
    const responseText = result?.content?.[0]?.text || "{}";
    // console.log("Response text:", responseText);
    let parsed;
    try {
      // Try to parse the JSON
      parsed = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      console.error("Raw response:", responseText);

      // Fallback response with error details
      return NextResponse.json({
        hexagram: title,
        description,
        error: "Failed to parse AI response",
        rawResponse: responseText.substring(0, 500), // First 500 chars for debugging
        personalTraits: "Unable to generate analysis at this time.",
        currentPhase: "Please try again.",
        careerGuidance: "Analysis unavailable.",
        relationshipGuidance: "Analysis unavailable.",
        growthRecommendations: ["Please try generating again"],
        timing: "Analysis unavailable.",
      });
    }
    return NextResponse.json({
      hexagram: title,
      description,
      ...parsed,
    });
  } catch (error) {
    console.error("Fortune life error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
