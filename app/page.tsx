import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import { InfoIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground font-serif">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {/* Navigation */}
        <nav className="w-full flex justify-center border-b border-border h-16 bg-secondary">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-4 items-center font-semibold text-lg tracking-wide text-primary">
              <Link href="/" className="hover:text-accent transition">
                🔮 易经占卜 · Destiny Lens
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
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Welcome to Destiny Lens
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            A poetic oracle inspired by the ancient wisdom of the Yijing. Let
            the coins fall and discover your hidden path.
          </p>
          <Link href="/protected">
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition shadow-sm">
              🔍 Consult the Oracle
            </button>
          </Link>
        </section>

        {/* Info Box */}
        {/* <div className="bg-accent text-accent-foreground text-sm p-3 px-5 rounded-md flex gap-3 items-center mt-8 shadow-sm border border-border">
          <InfoIcon size={16} />
          Built with Next.js, Supabase, and Claude AI.
        </div> */}

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t border-border mx-auto text-center text-xs gap-8 py-16 text-muted-foreground bg-secondary">
          <p>Created with 🌀 by your inner spirit.</p>
        </footer>
      </div>
    </main>
  );
}
