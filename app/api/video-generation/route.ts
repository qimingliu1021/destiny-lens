import { NextRequest, NextResponse } from "next/server";

interface ImageData {
  imageUrls: string[];
  city: string;
  count: number;
}

export async function POST(_req: NextRequest) {
  try {
    console.log("🚀 Video generation started...");

    // 1. Fetch cached images and city name from /api/image-fetching
    const fetchRes = await fetch("http://localhost:3000/api/image-fetching", {
      method: "POST",
    });
    console.log("Request is:", _req);
    console.log("Running image fetching...");

    if (!fetchRes.ok) {
      console.error("❌ Failed to fetch image data.");
      return NextResponse.json(
        { error: "Failed to fetch image data" },
        { status: 500 }
      );
    }

    const imageData: ImageData = await fetchRes.json();
    const images = imageData.imageUrls;

    console.log("🖼️ Images:", images);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
