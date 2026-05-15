import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap"
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

const mono = Fira_Code({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Atelier — Project Planner",
  description: "A quiet workshop for organizing the things you intend to do."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem("erisTheme") === "true") {
                document.documentElement.dataset.theme = "eris";
                document.documentElement.classList.remove("dark");
              } else {
                var t = localStorage.getItem("theme");
                if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                  document.documentElement.classList.add("dark");
                }
              }
            } catch(e) {}
          `
        }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
