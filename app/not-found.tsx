import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">This page got blocked.</h1>
      <p className="mt-3 max-w-md text-[15px] text-muted">
        The page you are looking for does not exist or may have moved. Check the
        URL, or head back to the store.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/products" variant="primary">
          Shop all products
        </Button>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </div>
    </div>
  );
}
