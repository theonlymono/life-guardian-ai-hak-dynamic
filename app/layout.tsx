import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Guardian AI",
  description:
    "An adaptive life companion that understands your changing situation and offers one useful next action each day.",
  icons: {
    icon: "/icon.png",
  },
};

// No maximum-scale: pinch-zoom stays available. The iOS focus-zoom it would
// have suppressed is handled by sizing inputs at 16px on small screens.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)}
    >
      <body className="flex min-h-full flex-col">
        {/* SVG noise filter for grainy gradient backgrounds — design.md §4.1 */}
        <svg className="hidden" aria-hidden>
          <filter id="grainy-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.80"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0"
            />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
