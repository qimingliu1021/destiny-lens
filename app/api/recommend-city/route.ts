import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

type City = {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  temperature?: number;
  population?: number;
  density?: number;
};

type ClaudeResponse = {
  content: { text: string }[];
};

// Get client IP
function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0] ?? null;
}

// Get lat/lng from IP using ipapi.co
async function getLatLngFromIP(ip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await res.json();
    if (geo.latitude && geo.longitude) {
      return { lat: geo.latitude, lng: geo.longitude };
    }
  } catch (e) {
    console.error("IP geolocation failed:", e);
  }
  return null;
}

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Directional filter based on relative position
function directionFilter(direction: string, userLat: number, userLng: number) {
  return (cityLat: number, cityLng: number) => {
    const latDiff = cityLat - userLat;
    const lngDiff = cityLng - userLng;
    switch (direction.toLowerCase()) {
      case "north": return latDiff > 2;
      case "south": return latDiff < -2;
      case "east": return lngDiff > 2;
      case "west": return lngDiff < -2;
      case "northeast": return latDiff > 2 && lngDiff > 2;
      case "northwest": return latDiff > 2 && lngDiff < -2;
      case "southeast": return latDiff < -2 && lngDiff > 2;
      case "southwest": return latDiff < -2 && lngDiff < -2;
      default: return true;
    }
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { direction, description }: { direction: string; description: string } = body;

  // Get user location from IP
  const ip = getClientIp(request) ?? "8.8.8.8"; // fallback
  const loc = await getLatLngFromIP(ip);
  const userLat = loc?.lat ?? 37.7749;
  const userLng = loc?.lng ?? -122.4194;

  const { data: rawCities, error } = await supabase
    .from("cities")
    .select("city, state_name, lat, lng, temperature, population, density");

  if (error || !rawCities) {
    return new Response(JSON.stringify({ error: "Failed to fetch cities", details: error.message }), { status: 500 });
  }

  const matchesDirection = directionFilter(direction, userLat, userLng);
  const MAX_RADIUS_KM = 800;

  const filteredCities: City[] = rawCities
    .filter((c) => {
      if (!c.lat || !c.lng) return false;
      const dist = haversineDistance(userLat, userLng, c.lat, c.lng);
      return dist <= MAX_RADIUS_KM && matchesDirection(c.lat, c.lng);
    })
    .map((c) => ({
      city: c.city,
      state: c.state_name || "Unknown",
      latitude: c.lat,
      longitude: c.lng,
      temperature: c.temperature,
      population: c.population,
      density: c.density
    }))
    // .slice(0, 10); // optional cap

  const cityText = filteredCities.map((c, i) =>
    `${i + 1}. ${c.city}, ${c.state}
  - Latitude: ${c.latitude}
  - Longitude: ${c.longitude}
  - Temperature: ${c.temperature ?? "Unknown"}°C
  - Population: ${c.population ?? "Unknown"}
  - Density: ${c.density ?? "Unknown"} people/km²`
  ).join("\n\n");

  const prompt = `
You are an expert in Chinese metaphysics and urban analysis, specializing in the Yi Jing (I Ching), elemental directionality, and lifestyle matching.

A user has received the following metaphysical reading:
- Direction: ${direction}
- Personality: ${description}
- Current location: lat ${userLat}, lng ${userLng}

Here are U.S. cities within 500 miles of their location that match the metaphysical direction:
${cityText}

Your task:

1. Begin with a brief, insightful interpretation of the user’s hexagram and **changing lines** (if known). 
   - Summarize what the **hexagram as a whole** means in terms of internal life phase or energy.
   - Then briefly explain what each of the specified **lines** (e.g., line 1, line 2, line 3) symbolizes.
   - Use this to reflect on what stage or mindset the user may be in (e.g., building something slowly, entering a time of stillness, releasing control, etc.).

2. Based on this metaphysical reading, choose **one city** from the list that most closely supports that phase of the user's journey.

3. Clearly explain **why that city is a good fit**, using practical, real-world reasoning:
   - What in the city’s industries, atmosphere, or lifestyle matches the hexagram’s energy?
   - What kind of person (based on the reading) would thrive in this place?
   - Why would this city nurture the user’s current path of development?

4. Finally, recommend **3–5 specific places** in that city the user should explore, that are aligned with their current metaphysical phase. These can include:
   - Quiet parks, coworking hubs, community wellness centers, public libraries, trails, art museums, cultural districts, or educational institutions.
   - Give a short reason for each recommendation — connect each to the reading when possible.

Tone: respectful, grounded, warm, and focused on real-world alignment with metaphysical insights.

🚫 Do NOT use symbolic metaphors like “this mountain represents your destiny.”
✅ DO ground your explanation in personal development and concrete traits like “this place supports quiet reflection, which suits someone in a growth phase.”

Respond in **valid JSON**:
{
  "city": "City Name",
  "why": "Personalized, real-world justification grounded in the user's hexagram and life phase.",
  "special_landmarks_to_visit": [
    "Specific place name and why it's relevant",
    "Another spot, with clear reasoning",
    "One more, e.g. job center, hiking spot, public library"
  ]
}

Example Output:
{
  "city": "San Francisco, California",
  "why": "Your hexagram, 'Developing Gradually' (Hexagram 53), reveals that you're entering a phase where meaningful growth happens slowly and requires patience. The first three lines speak of initial steps: line 1 reflects the importance of establishing strong foundations; line 2 emphasizes finding the right guidance and environment; and line 3 encourages quiet consistency over dramatic change. This reading suggests you're building toward something significant, and you need a space that allows steady evolution rather than pressure for fast results.\n\nSan Francisco aligns well with this phase. It's a city that supports gradual, intentional development — both personally and professionally. Its culture of innovation is built on long-standing values of creativity, resilience, and openness to change. Whether you're growing in your career, healing, or rediscovering your purpose, the city offers the blend of stimulation and introspection needed to evolve at your own pace.",
  "special_landmarks_to_visit": [
    "Lands End Trail – A quiet, scenic path that allows for reflection and steady movement, symbolic of your current internal journey.",
    "The Center SF – A wellness and mindfulness hub where you can engage in yoga, tea meditation, and community events that support slow personal growth.",
    "SFMOMA – A space that mirrors creative evolution and long-term thinking, ideal for someone embracing a journey of gradual transformation.",
    "San Francisco Public Library – A calm, resource-rich environment that encourages disciplined learning and introspective focus.",
    "Golden Gate Park – A place for long walks, nature immersion, and grounding, reinforcing the idea that growth doesn't need to be rushed."
  ]
}
`;

  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 600,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const result = (await response.json()) as ClaudeResponse;
  const text = result.content?.[0]?.text || "";

  try {
    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ raw: text, error: "Could not parse Claude's response as JSON" }), { status: 200 });
  }
}
