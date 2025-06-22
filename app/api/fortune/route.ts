import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const trigramMap: Record<string, { name: string; symbol: string; direction: string; element: string }> = {
  '111': { name: 'Qián', symbol: '☰', direction: 'Northwest', element: 'Heaven' },
  '000': { name: 'Kūn', symbol: '☷', direction: 'Southwest', element: 'Earth' },
  '011': { name: 'Duì', symbol: '☱', direction: 'West', element: 'Lake' },
  '101': { name: 'Lí', symbol: '☲', direction: 'South', element: 'Fire' },
  '001': { name: 'Zhèn', symbol: '☳', direction: 'East', element: 'Thunder' },
  '110': { name: 'Xùn', symbol: '☴', direction: 'Southeast', element: 'Wind' },
  '010': { name: 'Kǎn', symbol: '☵', direction: 'North', element: 'Water' },
  '100': { name: 'Gèn', symbol: '☶', direction: 'Northeast', element: 'Mountain' },
};

function getHexagramDirections(reversedBinary: string): string {
  const lower = reversedBinary.slice(0, 3).split('').reverse().join('');
  const upper = reversedBinary.slice(3, 6).split('').reverse().join('');
  const lowerTrigram = trigramMap[lower];
  const upperTrigram = trigramMap[upper];

  if (!lowerTrigram || !upperTrigram) return 'Trigram directions unknown.';

  return [
    `Lower Trigram: ${lowerTrigram.symbol} (${lowerTrigram.name}, ${lowerTrigram.element}) → ${lowerTrigram.direction}`,
    `Upper Trigram: ${upperTrigram.symbol} (${upperTrigram.name}, ${upperTrigram.element}) → ${upperTrigram.direction}`,
    `Overall Directional Flow: ${lowerTrigram.direction} ➝ ${upperTrigram.direction}`,
  ].join('\n');
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured – no API key.' }, { status: 500 });
  }

  try {
    const { binary } = await req.json();
    if (!binary || typeof binary !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const reversedBinary = binary.split('').reverse().join('');
    const filePath = path.join(process.cwd(), 'public', 'yijing_fixed.csv');
    const csvRaw = await readFile(filePath, 'utf-8');
    const records = parse(csvRaw, { columns: true, skip_empty_lines: true });

    const match = records.find((row: any) => row.binary === reversedBinary);

    if (!match) {
      console.warn('🔍 No match for binary:', reversedBinary);
      return NextResponse.json({ error: 'Hexagram not found' }, { status: 404 });
    }

    const title = match.english;
    const description = match.symbolic;

    const lineDescriptions = [
      "Line 1 (Foundation): The beginning of change; initial conditions.",
      "Line 2 (Field/Response): The appropriate response to external action.",
      "Line 3 (Decision Point): Danger of excess or premature action.",
      "Line 4 (Transition): Movement toward resolution, but still unstable.",
      "Line 5 (Ruler/Guide): Power in alignment; effective leadership.",
      "Line 6 (Completion): End of cycle; transcendence or decay."
    ];

    const linesWithMeaning = reversedBinary
      .split('')
      .map((bit, i) => {
        const lineType = bit === '1' ? 'Yang (solid)' : 'Yin (broken)';
        return `${lineDescriptions[i]} → ${lineType}`;
      })
      .join('\n');

    const directionText = getHexagramDirections(reversedBinary);

    const trigramTable = `
Trigram Table:
Symbol  Name    Element    Direction
☰       Qián    Heaven     Northwest
☷       Kūn     Earth      Southwest
☱       Duì     Lake       West
☲       Lí      Fire       South
☳       Zhèn    Thunder    East
☴       Xùn     Wind       Southeast
☵       Kǎn     Water      North
☶       Gèn     Mountain   Northeast
    `.trim();

    const prompt = `
You are a Yijing diviner and advisor.

A user has drawn Hexagram "${title}" with the following symbolic meaning:
"${description}"

These are the six lines of their hexagram, from bottom (Line 1) to top (Line 6):

${linesWithMeaning}

${directionText}

${trigramTable}

Provide a fortune that interprets the overall meaning of the hexagram **and how the specific lines affect the user's situation**. Be clear and grounded. Speak as a wise, honest advisor—not a poet or a mystic. Include observations about where the user may face opportunity or difficulty. Keep it under 200 words.
    `.trim();

    const claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const raw = await claudeRes.json();
    const fortuneBody = raw?.content?.[0]?.text?.trim() || 'The oracle is silent.';

    const fullOutput = `${fortuneBody}\n\n🧭 ${directionText}`;

    return NextResponse.json({ fortune: fullOutput, debug: raw });
  } catch (err) {
    console.error('❌ Error in /api/fortune:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
