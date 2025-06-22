const fs = require("fs/promises");
const path = require("path");
const fetch = require("node-fetch"); // npm install node-fetch@2

const DOWNLOAD_DIR = path.join(__dirname, "downloads");

// Set your city name here (use lowercase, no spaces for filenames)
const city = "newyork";

const prompts = [
  "Wall Street & the New York Stock Exchange",
  "Federal Reserve Bank of New York",
  "One World Trade Center (Freedom Tower)",
  "The High Line New York",
  "Brooklyn Bridge at sunset",
];

async function downloadImage(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(
    path.join(DOWNLOAD_DIR, filename),
    Buffer.from(arrayBuffer)
  );
}

async function duckDuckGoImageSearch(query) {
  // Step 1: Get the vqd token
  const params = new URLSearchParams({ q: query });
  const tokenRes = await fetch(`https://duckduckgo.com/?${params}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  const tokenText = await tokenRes.text();
  let vqdMatch = tokenText.match(/vqd='([\d-]+)'/);
  if (!vqdMatch) {
    vqdMatch = tokenText.match(/vqd=([\d-]+)\&/);
  }
  if (!vqdMatch) throw new Error("Failed to get vqd token from DuckDuckGo");
  const vqd = vqdMatch[1];

  // Step 2: Get image results
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
  if (!res.ok) throw new Error("DuckDuckGo image search failed");
  const data = await res.json();
  return data.results?.[0]?.image || null;
}

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    try {
      const imageUrl = await duckDuckGoImageSearch(prompt);
      if (!imageUrl) {
        console.log(`No image found for prompt: ${prompt}`);
        continue;
      }
      // Sanitize prompt for filename
      const promptPart = sanitizeFilename(prompt).slice(0, 30); // limit length
      const filename = `${city}_${promptPart}_${i + 1}.jpg`;
      await downloadImage(imageUrl, filename);
      console.log(`Downloaded: ${filename} for prompt: ${prompt}`);
    } catch (e) {
      console.log(`Error for prompt "${prompt}": ${e.message}`);
    }
  }
}

main();
