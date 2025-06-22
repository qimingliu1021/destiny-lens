'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InfoIcon } from 'lucide-react';

const trigramMap: Record<string, { name: string; symbol: string; direction: string }> = {
  '111': { name: 'Qián', symbol: '☰', direction: 'Northwest' },
  '000': { name: 'Kūn', symbol: '☷', direction: 'Southwest' },
  '011': { name: 'Duì', symbol: '☱', direction: 'West' },
  '101': { name: 'Lí', symbol: '☲', direction: 'South' },
  '001': { name: 'Zhèn', symbol: '☳', direction: 'East' },
  '110': { name: 'Xùn', symbol: '☴', direction: 'Southeast' },
  '010': { name: 'Kǎn', symbol: '☵', direction: 'North' },
  '100': { name: 'Gèn', symbol: '☶', direction: 'Northeast' },
};

const getHexagramDirections = (hexagram: string[]): string => {
  if (hexagram.length !== 6) return 'Unknown';
  const binary = hexagram.map((l) => (l === 'yang' ? '1' : '0'));
  const lower = binary.slice(0, 3).reverse().join('');
  const upper = binary.slice(3, 6).reverse().join('');
  const lowerTrigram = trigramMap[lower];
  const upperTrigram = trigramMap[upper];
  if (!lowerTrigram || !upperTrigram) return 'Direction unknown';
  return `Lower Trigram: ${lowerTrigram.symbol} (${lowerTrigram.name}) → ${lowerTrigram.direction}\nUpper Trigram: ${upperTrigram.symbol} (${upperTrigram.name}) → ${upperTrigram.direction}`;
};

export default function ProtectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hexagram, setHexagram] = useState<string[]>([]);
  const [fortune, setFortune] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLines, setShowLines] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/auth/login');
      } else {
        setUser(data.user);
      }
    };
    getUser();
  }, [router]);

  const flipCoins = async () => {
    setFortune(null);
    setShowLines(false);
    setLoading(true);

    const newHexagram = Array.from({ length: 6 }, () =>
      Math.random() < 0.5 ? 'yin' : 'yang'
    );
    setHexagram(newHexagram);

    const binary = newHexagram.map((l) => (l === 'yang' ? '1' : '0')).join('');
    console.log('🔢 Generated binary:', binary);

    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        body: JSON.stringify({ binary }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      console.log('🔮 Response from oracle:', data);

      setTimeout(() => {
        setShowLines(true);
        setFortune(data.fortune || 'Could not generate a fortune. Try again.');
      }, 1000);
    } catch (e) {
      console.error('❌ Error calling oracle:', e);
      setFortune('Error connecting to the oracle.');
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const renderCoin = (line: string, index: number) => (
    <div
      key={index}
      className={`relative w-12 h-12 rounded-full shadow-md text-xl font-bold transition-all duration-700 flex items-center justify-center ${
        loading
          ? 'bg-gray-300 animate-spin-slow'
          : `${line === 'yang' ? 'bg-yellow-400 text-black' : 'bg-purple-500 text-white'} animate-bounce-slight`
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center text-2xl">
          🪙
        </span>
      )}
      {!loading && (line === 'yang' ? '⚊' : '⚋')}
    </div>
  );

  const renderLine = (line: string, index: number) => (
    <div
      key={index}
      className={`text-lg font-mono py-1 transition-opacity duration-300 ${
        showLines ? 'opacity-100' : 'opacity-0'
      } ${line === 'yang' ? 'text-yellow-500' : 'text-purple-500'}`}
    >
      {line === 'yang' ? '⚊ Yang (solid)' : '⚋ Yin (broken)'}
    </div>
  );

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8 p-8">
      <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
        <InfoIcon size={16} strokeWidth={2} />
        Welcome to Destiny Lens – your personal Yijing fortune teller.
      </div>

      {user && (
        <div className="w-full max-w-md bg-background rounded-lg border p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Your Destiny Hexagram</h2>

          <button
            onClick={flipCoins}
            className="mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-5 py-2 rounded-xl shadow-lg shadow-purple-500/40 hover:shadow-pink-500/50 transition-all duration-300 ease-in-out font-semibold tracking-wider"
            disabled={loading}
          >
            {loading ? 'Consulting the Yijing...' : 'Flip the Coins of Fate'}
          </button>

          {hexagram.length > 0 && (
  <>
    <div className="flex justify-center gap-2 mb-4">
      {hexagram.map((line, i) => renderCoin(line, i))}
    </div>
    <div className="flex flex-col-reverse gap-2 mb-4">
      {hexagram.map((line, i) => renderLine(line, i))}
    </div>

    {showLines && (
      <div className="text-sm text-center text-muted-foreground mt-2 whitespace-pre-line">
        {getHexagramDirections(hexagram)}
      </div>
    )}
  </>
)}


          {fortune && (
            <div className="mt-4 p-4 border rounded bg-muted text-sm whitespace-pre-line">
              {fortune}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
