"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Recoverable error boundary for route segments. Offers retry and a way home
 * instead of a dead end.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where a real error reporter would be wired.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow text-danger">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-bold">We could not load this page.</h1>
      <p className="mt-3 max-w-md text-[15px] text-muted">
        An unexpected error occurred. Try again — if it keeps happening, please
        contact support.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </div>
    </div>
  );
}
