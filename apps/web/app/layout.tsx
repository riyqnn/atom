import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ATOM — Advanced Trading Optimization Matrix",
  description:
    "LLM-powered strategy generation platform. Detect Liquidity Mirages, generate quantitative strategies, and validate through backtesting.",
  keywords: ["crypto", "trading", "strategy", "LLM", "derivatives", "backtest"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full bg-grid" style={{ background: "#0A0E27" }}>
        {children}
      </body>
    </html>
  );
}
