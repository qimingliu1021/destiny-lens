// src/app/page.tsx
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import { InfoIcon } from "lucide-react";


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {/* Navigation */}
        <nav className="w-full flex justify-center border-b border-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-4 items-center font-semibold text-lg">
              <Link href="/" className="hover:text-primary transition">
                🔮 Destiny Lens
              </Link>
            </div>
            <div className="flex gap-4 items-center">
              <AuthButton />
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center max-w-2xl px-6 mt-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Destiny Lens</h1>
          <p className="text-lg text-muted-foreground mb-6">
            A poetic oracle inspired by the ancient wisdom of the Yijing. Let the coins fall and discover your hidden path.
          </p>
          <Link href="/protected">
  <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition">
    🔍 Consult the Oracle
  </button>

          </Link>
        </section>

        {/* Info Box */}
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center mt-8">
          <InfoIcon size={16} />
          Built with Next.js, Supabase, and Claude AI.
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Created with 🌀 &nbsp;by your inner spirit.
          </p>
        </footer>
      </div>
    </main>
  );
}
