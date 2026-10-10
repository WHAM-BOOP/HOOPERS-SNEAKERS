"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthField, AuthShell } from "@/components/auth/auth-shell";
import { Notice } from "@/components/ui/notice";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase is not configured yet — registration is disabled. See the setup guide.",
      );
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // With email confirmation enabled, Supabase returns no session here.
    if (data.session) {
      router.push("/account");
      router.refresh();
    } else {
      setNeedsConfirmation(true);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track orders and check out faster — it takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {needsConfirmation ? (
        <Notice tone="success" title="Check your inbox">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then{" "}
          <Link href="/auth/sign-in" className="font-semibold underline">
            sign in
          </Link>
          .
        </Notice>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error ? (
            <Notice tone="danger" title="Sign up failed">
              {error}
            </Notice>
          ) : null}

          <AuthField
            id="signup-name"
            label="Full name"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
          />
          <AuthField
            id="signup-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <AuthField
            id="signup-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            hint="At least 8 characters."
          />

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-[12px] leading-relaxed text-muted">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline">
              terms of service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>
            .
          </p>
        </form>
      )}
    </AuthShell>
  );
}
