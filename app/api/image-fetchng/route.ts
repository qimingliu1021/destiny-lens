import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/images/search";
const BING_KEY = process.env.BING_IMAGE_SEARCH_KEY!;
const DOWNLOAD_DIR = path.join(
  process.cwd(),
  "app/api/image-fetchng/downloads"
);

async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  await writeFile(path.join(DOWNLOAD_DIR, filename), Buffer.from(arrayBuffer));
}

export async function POST(req: NextRequest) {
  try {
    const { prompts } = await req.json();

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: "No prompts provided." },
        { status: 400 }
      );
    }

    // Ensure the download directory exists
    await mkdir(DOWNLOAD_DIR, { recursive: true });

    const results = await Promise.all(
      prompts.map(async (prompt, idx) => {
        const url = `${BING_ENDPOINT}?q=${encodeURIComponent(prompt)}&count=1`;
        const res = await fetch(url, {
          headers: { "Ocp-Apim-Subscription-Key": BING_KEY },
        });
        if (!res.ok) return { prompt, image: null, error: "Search failed" };
        const data = await res.json();
        const imageUrl = data.value?.[0]?.contentUrl || null;
        if (!imageUrl) return { prompt, image: null, error: "No image found" };

        // Download the image
        const filename = `image_${idx + 1}.jpg`;
        try {
          await downloadImage(imageUrl, filename);
          return {
            prompt,
            image: `/app/api/image-fetchng/downloads/${filename}`,
          };
        } catch (e) {
          return { prompt, image: null, error: "Download failed" };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error", details: String(e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "POST a JSON body with { prompts: [ ... ] } to fetch and download images for each prompt.",
    example: {
      prompts: [
        "Wall Street & the New York Stock Exchange – portray the core of global finance.",
        "Federal Reserve Bank of New York – represent stability and control.",
        // ...etc
      ],
    },
  });
}
