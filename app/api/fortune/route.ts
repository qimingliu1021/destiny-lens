import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@/lib/supabase/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

type Trigram = {
  name: string;
  symbol: string;
  direction: string;
  element: string;
};

type City = {
  city: string;
  state_name: string;
  lat: number;
  lng: number;
};

const trigramMap: Record<string, Trigram> = {
  '111': { name: 'Qián', symbol: '☰', direction: 'Northwest', element: 'Heaven' },
  '000': { name: 'Kūn', symbol: '☷', direction: 'Southwest', element: 'Earth' },
  '011': { name: 'Duì', symbol: '☱', direction: 'West', element: 'Lake' },
  '101': { name: 'Lí', symbol: '☲', direction: 'South', element: 'Fire' },
  '001': { name: 'Zhèn', symbol: '☳', direction: 'East', element: 'Thunder' },
  '110': { name: 'Xùn', symbol: '☴', direction: 'Southeast', element: 'Wind' },
  '010': { name: 'Kǎn', symbol: '☵', direction: 'North', element: 'Water' },
  '100': { name: 'Gèn', symbol: '☶', direction: 'Northeast', element: 'Mountain' },
};

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0] ?? null;
}

async function getLatLngFromIP(ip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await res.json();
    if (geo.latitude && geo.longitude) {
      return { lat: geo.latitude, lng: geo.longitude };
    }
  } catch (e) {
    console.error('IP geolocation failed:', e);
  }
  return null;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function directionFilter(direction: string, userLat: number, userLng: number) {
  return (cityLat: number, cityLng: number): boolean => {
    const latDiff = cityLat - userLat;
    const lngDiff = cityLng - userLng;
    switch (direction.toLowerCase()) {
      case 'north': return latDiff > 2;
      case 'south': return latDiff < -2;
      case 'east': return lngDiff > 2;
      case 'west': return lngDiff < -2;
      case 'northeast': return latDiff > 2 && lngDiff > 2;
      case 'northwest': return latDiff > 2 && lngDiff < -2;
      case 'southeast': return latDiff < -2 && lngDiff > 2;
      case 'southwest': return latDiff < -2 && lngDiff < -2;
      default: return true;
    }
  };
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured – no API key.' }, { status: 500 });
  }

  const { binary } = await req.json();
  if (!binary || typeof binary !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const reversedBinary = binary.split('').reverse().join('');
  const filePath = path.join(process.cwd(), 'public', 'yijing_fixed.csv');
  const csvRaw = await readFile(filePath, 'utf-8');
  const records: any[] = parse(csvRaw, { columns: true, skip_empty_lines: true });
  const match = records.find((row) => row.binary === reversedBinary);

  if (!match) {
    return NextResponse.json({ error: 'Hexagram not found' }, { status: 404 });
  }

  const title = match.english;
  const description = match.symbolic;
  const lineDescriptions = [
    'Line 1 (Foundation): The beginning of change; initial conditions.',
    'Line 2 (Field/Response): The appropriate response to external action.',
    'Line 3 (Decision Point): Danger of excess or premature action.',
    'Line 4 (Transition): Movement toward resolution, but still unstable.',
    'Line 5 (Ruler/Guide): Power in alignment; effective leadership.',
    'Line 6 (Completion): End of cycle; transcendence or decay.',
  ];

  const linesWithMeaning = reversedBinary
    .split('')
    .map((bit, i) => `${lineDescriptions[i]} → ${bit === '1' ? 'Yang (solid)' : 'Yin (broken)'}`)
    .join('\n');

  const lower = reversedBinary.slice(0, 3).split('').reverse().join('');
  const upper = reversedBinary.slice(3, 6).split('').reverse().join('');
  const lowerTrigram = trigramMap[lower];
  const upperTrigram = trigramMap[upper];
  const direction = lowerTrigram?.direction || 'unknown';

  const directionText = [
    `Lower Trigram: ${lowerTrigram?.symbol} (${lowerTrigram?.name}, ${lowerTrigram?.element}) → ${lowerTrigram?.direction}`,
    `Upper Trigram: ${upperTrigram?.symbol} (${upperTrigram?.name}, ${upperTrigram?.element}) → ${upperTrigram?.direction}`,
    `Overall Directional Flow: ${lowerTrigram?.direction} ➝ ${upperTrigram?.direction}`,
  ].join('\n');

  const ip = getClientIp(req) ?? '8.8.8.8';
  const loc = await getLatLngFromIP(ip);
  const userLat = loc?.lat ?? 37.7749;
  const userLng = loc?.lng ?? -122.4194;

  const supabase = await createClient();

  const { data: rawCities, error } = await supabase
    .from('cities')
    .select('city, state_name, lat, lng');

  if (error || !rawCities) {
    return NextResponse.json({ error: 'Failed to fetch cities', details: error.message }, { status: 500 });
  }

  const matchesDirection = directionFilter(direction, userLat, userLng);

  const nearbyCities = rawCities
    .filter((c: City) =>
      c.lat &&
      c.lng &&
      haversineDistance(userLat, userLng, c.lat, c.lng) <= 800 &&
      matchesDirection(c.lat, c.lng)
    )
    .map((c: City) => ({
      city: c.city,
      state: c.state_name,
      latitude: c.lat,
      longitude: c.lng,
    }))
    .slice(0, 10);

  const cityText = nearbyCities
    .map((c, i) => `${i + 1}. ${c.city}, ${c.state} (lat: ${c.latitude}, lng: ${c.longitude})`)
    .join('\n');

  const prompt = `A user has drawn Hexagram "${title}" (${description})\n\n${linesWithMeaning}\n\n${directionText}\n\nHere are some cities in the ${direction} direction near their location:\n${cityText}\n\nPick one and explain why it suits them in realistic terms. Recommend 3–5 places they should explore there. Respond in JSON.`;

  const claudeRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 600,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await claudeRes.json();

  try {
    const parsed = JSON.parse(result?.content?.[0]?.text || '');
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      raw: result?.content?.[0]?.text,
      error: 'Could not parse Claude response',
    }, { status: 200 });
  }
}
