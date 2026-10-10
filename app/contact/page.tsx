"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Notice } from "@/components/ui/notice";

type FieldErrors = Record<string, string>;

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function set(key: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (form.name.trim().length < 2 || !form.email.trim() || form.message.trim().length < 5) {
      setFormError("Please fill in name, email, and a message.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as {
        message?: string;
        fieldErrors?: FieldErrors;
      };

      if (!response.ok) {
        if (payload.fieldErrors) setFieldErrors(payload.fieldErrors);
        setFormError(payload.message ?? "Could not send your message.");
        return;
      }

      setSent(true);
      setForm(initialForm);
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <p className="eyebrow">Support</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Contact us</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Questions about sizing, an order, or a restock? Send a message — we
            usually reply within one business day.
          </p>
        </header>

        <div className="mt-8">
          {sent ? (
            <Notice tone="success" title="Message sent">
              Thanks for reaching out. Your message is in our inbox and we will
              get back to you soon.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => setSent(false)}
              >
                Send another
              </button>
            </Notice>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5 rounded-md border border-line bg-surface p-6 sm:p-8"
            >
              {formError ? (
                <Notice tone="danger" title="Could not send message">
                  {formError}
                </Notice>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="contact-name"
                  label="Name"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  error={fieldErrors.name}
                  autoComplete="name"
                />
                <Field
                  id="contact-email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  error={fieldErrors.email}
                  autoComplete="email"
                />
                <Field
                  id="contact-phone"
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                  error={fieldErrors.phone}
                  autoComplete="tel"
                />
                <Field
                  id="contact-subject"
                  label="Subject"
                  value={form.subject}
                  onChange={(v) => set("subject", v)}
                  error={fieldErrors.subject}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="label">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  className="input"
                  maxLength={5000}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  aria-invalid={fieldErrors.message ? true : undefined}
                />
                {fieldErrors.message ? (
                  <p className="field-error">{fieldErrors.message}</p>
                ) : null}
              </div>

              <button type="submit" className="btn-primary w-full" disabled={sending}>
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center text-[13.5px] text-muted">
          <p>
            Looking for an existing order?{" "}
            <Link href="/orders/lookup" className="font-semibold text-accent hover:underline">
              Track it here
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
