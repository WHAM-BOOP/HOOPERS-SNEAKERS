import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SetupBanner } from "@/components/layout/setup-banner";
import { getHeaderUser } from "@/lib/auth/session";
import { CartProvider } from "@/lib/cart/cart-context";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: "Hoopers Sneakers — Premium Basketball Shoes & Athletic Footwear",
    template: "%s · Hoopers Sneakers",
  },
  description:
    "Hoopers Sneakers is a basketball shoes store for players, gymnasts, designers, and everyone who moves. Court-tested basketball shoes, training and lifestyle sneakers with honest sizing and pay-on-delivery checkout.",
  applicationName: "Hoopers Sneakers",
  keywords: [
    "basketball shoes",
    "sneakers",
    "hoops",
    "athletic footwear",
    "gymnastics shoes",
    "training shoes",
  ],
  openGraph: {
    type: "website",
    siteName: "Hoopers Sneakers",
    title: "Hoopers Sneakers — Premium Basketball Shoes",
    description:
      "Court-tested basketball shoes and athletic footwear. Pay on delivery.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoopers Sneakers",
    description:
      "Court-tested basketball shoes and athletic footwear. Pay on delivery.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f2",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getHeaderUser();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only z-50 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to main content
        </a>
        <CartProvider>
          <SetupBanner />
          <Header user={user} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
