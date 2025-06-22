import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline transition-colors"
        >
          ← Back to Home
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
