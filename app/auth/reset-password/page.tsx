"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AuthField, AuthShell } from "@/components/auth/auth-shell";
import { Notice } from "@/components/ui/notice";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<"request" | "reset" | "loading">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMode("request");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      // A recovery session means the user clicked the reset link.
      setMode(data.session ? "reset" : "request");
    });
  }, []);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured yet. See the setup guide.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password` },
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo(
      `If an account exists for ${email}, a password reset link is on its way.`,
    );
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured yet. See the setup guide.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setInfo("Password updated. You can now sign in with your new password.");
    setMode("request");
  }

  return (
    <AuthShell
      title={mode === "reset" ? "Choose a new password" : "Reset your password"}
      subtitle={
        mode === "reset"
          ? "Enter your new password below."
          : "We will email you a secure link to set a new password."
      }
      footer={
        <Link href="/auth/sign-in" className="font-semibold text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {mode === "loading" ? (
        <div className="space-y-4" role="status" aria-label="Loading">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      ) : (
        <form
          onSubmit={mode === "reset" ? handleReset : handleRequest}
          noValidate
          className="space-y-5"
        >
          {error ? (
            <Notice tone="danger" title="Something went wrong">
              {error}
            </Notice>
          ) : null}
          {info ? (
            <Notice tone="success" title="Done">
              {info}
            </Notice>
          ) : null}

          {mode === "request" ? (
            <AuthField
              id="reset-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
          ) : (
            <AuthField
              id="reset-password"
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters."
            />
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading
              ? "Working…"
              : mode === "reset"
                ? "Update password"
                : "Email me a reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
