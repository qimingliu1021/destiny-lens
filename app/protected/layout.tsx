import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
      <nav className="w-full border-b border-border bg-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link href="/" className="hover:underline">
              Destiny Lens
            </Link>
          </div>
          <div>{!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}</div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-5xl px-4 py-10">{children}</div>

      <footer className="w-full border-t border-border bg-muted text-xs text-muted-foreground py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center sm:text-left">
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              rel="noreferrer"
              className="font-bold hover:underline"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </div>
      </footer>
    </main>
  );
}
