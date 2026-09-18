import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuroraBackground } from "@/components/visual/AuroraBackground";

import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "City Intelligence — Air Quality",
  description:
    "Air-quality readings, trends, short-range forecasts and neighbourhood comparisons for Lahore.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      /**
       * Dark is the design, not a preference: the glass surfaces, the aurora
       * wash and the AQI palette are all tuned against a near-black ground.
       * The light tokens stay in `globals.css` so a theme switch remains
       * possible, but nothing selects them today.
       */
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <AuroraBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
