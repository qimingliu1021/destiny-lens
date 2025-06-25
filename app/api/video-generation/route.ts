import { NextRequest, NextResponse } from "next/server";
import { renderMedia } from "@remotion/renderer";
import path from "path";
import fs from "fs";

// Helper to confirm a file exists
function fileExists(filePath: string) {
  return fs.existsSync(filePath);
}

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Video generation started...");

    // 1. Fetch cached images and city name from /api/image-fetching
    const fetchRes = await fetch("http://localhost:3000/api/image-fetching", {
      method: "POST",
    });

    console.log("Running image fetching...");
    
    if (!fetchRes.ok) {
      console.error("❌ Failed to fetch image data.");
      return NextResponse.json(
        { error: "Failed to fetch image data" },
        { status: 500 }
      );
    }

    // 2. Extract local image paths
    // const images: string[] = results;
    //   .map((r: any) => {
    //     const imagePath = path.join(
    //       process.cwd(),
    //       "public",
    //       r.image?.replace(
    //         "/api/video-generation/images",
    //         "app/api/video-generation/images"
    //       )
    //     );
    //     if (r.image && fileExists(imagePath)) {
    //       return r.image;
    //     } else {
    //       console.warn(`⚠️ Missing or invalid image for: ${r.landmark}`);
    //       return null;
    //     }
    //   })
    //   .filter(Boolean);

    // if (images.length === 0) {
    //   console.error("❌ No valid images found for video rendering.");
    //   return NextResponse.json(
    //     { error: "No valid images to render" },
    //     { status: 400 }
    //   );
    // }

    // // 3. Choose a default music file
    // const music = "/music/grand_1.mp3"; // Must exist in /public/music/

    // const remotionServePath = path.join(process.cwd(), "app/remotion");
    // if (!fs.existsSync(remotionServePath)) {
    //   console.error("❌ Remotion bundle not found at:", remotionServePath);
    //   return NextResponse.json(
    //     { error: "Remotion bundle not found" },
    //     { status: 500 }
    //   );
    // }

    // // 4. Create output file path
    // const timestamp = Date.now();
    // const outputFile = path.join(
    //   process.cwd(),
    //   "public",
    //   `output-${timestamp}.mp4`
    // );
    // console.log("🎬 Output path:", outputFile);

    // // 5. Call Remotion to render video
    // await renderMedia({
    //   composition: "Slideshow",
    //   serveUrl: remotionServePath,
    //   codec: "h264",
    //   outputLocation: outputFile,
    //   inputProps: {
    //     images,
    //     music,
    //     city,
    //   },
    // });

    // const videoUrl = `/output-${timestamp}.mp4`;
    // console.log("✅ Video generated:", videoUrl);

    // return NextResponse.json({ videoUrl, city, count: images.length });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("🔥 Error in video generation:", e);
    return NextResponse.json(
      { error: "Video generation failed", details: e.message },
      { status: 500 }
    );
  }
}
