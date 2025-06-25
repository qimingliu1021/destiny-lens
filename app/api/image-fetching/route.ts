import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

// Helper to download images
async function downloadImage(url: string, filename: string, folder: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`❌ Failed to download image: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  await mkdir(folder, { recursive: true });
  const filePath = path.join(folder, filename);
  await writeFile(filePath, Buffer.from(arrayBuffer));
  console.log(`✅ Image saved: ${filePath}`);
}

// DuckDuckGo image search logic (no API key needed)
async function duckDuckGoImageSearch(query: string): Promise<string | null> {
  const params = new URLSearchParams({ q: query });
  const tokenRes = await fetch(`https://duckduckgo.com/?${params}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  const tokenText = await tokenRes.text();
  let vqdMatch =
    tokenText.match(/vqd='([\d-]+)'/) || tokenText.match(/vqd=([\d-]+)\&/);
  if (!vqdMatch) {
    console.log("❌ No vqd token found in DuckDuckGo search page.");
    return null;
  }
  const vqd = vqdMatch[1];

  const apiUrl = `https://duckduckgo.com/i.js?${new URLSearchParams({
    l: "us-en",
    o: "json",
    q: query,
    vqd,
    f: "",
    p: "1",
  })}`;
  const res = await fetch(apiUrl, {
    headers: {
      Referer: "https://duckduckgo.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  if (!res.ok) {
    console.log(`❌ Image API failed for query: ${query}`);
    return null;
  }
  const data = await res.json();
  return data.results?.[0]?.image || null;
}

export async function POST() {
  try {
    console.log("🔍 Fetching city and landmarks from /api/fortune");
    // 1. Fetch city and landmarks from /api/fortune
    const fortuneRes = await fetch("http://localhost:3000/api/fortune");
    const fortuneData = await fortuneRes.json();
    console.log(
      "🔍 Fetched from /api/fortune:",
      JSON.stringify(fortuneData, null, 2)
    );

    const city = fortuneData.city || fortuneData.City || "";
    const landmarks =
      fortuneData.landmarks ||
      fortuneData.Landmarks ||
      fortuneData.places ||
      [];

    if (!city || !Array.isArray(landmarks) || landmarks.length === 0) {
      console.log("⚠️ Invalid fortune data. Missing city or landmarks.");
      return NextResponse.json(
        { error: "No city or landmarks found from /api/fortune." },
        { status: 400 }
      );
    }

    console.log(`🌆 Target City: ${city}`);
    console.log(`📍 Landmarks to search:`, landmarks);

    // 2. Set the target folder to save images
    const targetFolder = path.join(
      process.cwd(),
      "app/api/video-generation/images"
    );

    // 3. Search and download images
    const results = await Promise.all(
      landmarks.map(async (landmark, idx) => {
        const searchQuery = `${landmark}, ${city}`;
        console.log(`🔎 Searching image for: "${searchQuery}"`);
        try {
          const imageUrl = await duckDuckGoImageSearch(searchQuery);
          if (!imageUrl) {
            console.log(`❌ No image found for ${landmark}`);
            return { landmark, image: null, error: "No image found" };
          }

          const safeLandmark = landmark.replace(/\s+/g, "_").toLowerCase();
          const safeCity = city.replace(/\s+/g, "_").toLowerCase();
          const filename = `${safeCity}_${safeLandmark}.jpg`;

          await downloadImage(imageUrl, filename, targetFolder);
          return {
            landmark,
            image: `/api/video-generation/images/${filename}`,
          };
        } catch (err) {
          console.error(`❌ Error processing ${landmark}:`, err);
          return {
            landmark,
            image: null,
            error: "Image search or download failed",
          };
        }
      })
    );

    console.log("✅ Final image-fetching result:", results);

    return NextResponse.json({ city, results });
  } catch (e) {
    console.error("🔥 Unexpected error in image-fetching route:", e);
    return NextResponse.json(
      { error: "Internal server error", details: String(e) },
      { status: 500 }
    );
  }
}
