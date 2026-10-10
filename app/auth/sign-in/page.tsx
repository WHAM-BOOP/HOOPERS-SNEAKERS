"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthField, AuthShell } from "@/components/auth/auth-shell";
import { Notice } from "@/components/ui/notice";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase is not configured yet — sign in is disabled. See the setup guide.",
      );
      return;
    }

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password combination is not correct."
          : signInError.message,
      );
      return;
    }

    router.push(safeNext);
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your orders and check out faster."
      footer={
        <>
          New here?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error ? (
          <Notice tone="danger" title="Sign in failed">
            {error}
          </Notice>
        ) : null}

        <AuthField
          id="signin-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <AuthField
          id="signin-password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          minLength={8}
        />

        <div className="flex items-center justify-between">
          <Link
            href="/auth/reset-password"
            className="text-[13px] font-medium text-muted hover:text-accent"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container-page py-12"><div className="mx-auto max-w-md skeleton h-96" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
