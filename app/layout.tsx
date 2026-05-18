import type { Metadata } from "next";
import { IBM_Plex_Mono, Lora } from "next/font/google";
import { RouteTransitionProvider } from "@/components/route-transition-provider";
import { getMetadataBase } from "@/lib/site-url";
import "./globals.css";

const mono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600"],
  variable: "--font-mono",
});

const serif = Lora({
  subsets: ["latin", "cyrillic"],
  weight: ["600"],
  variable: "--font-serif",
});

const themeInitScript = `(() => {
  try {
    const cookieLanguage = document.cookie
      .split("; ")
      .find((item) => item.startsWith("tvorogme-language="))
      ?.split("=")[1];
    const language = cookieLanguage;
    const preference = window.localStorage.getItem("tvorogme-theme");
    const root = document.documentElement;

    if (language === "en" || language === "ru" || language === "zh") {
      root.lang = language === "zh" ? "zh-CN" : language;
      root.dataset.language = language;
    }

    root.dataset.theme = preference === "dark" ? "dark" : "light";
  } catch {}
})();`;

export const metadata: Metadata = {
  title: "tvorog.me",
  description:
    "A system-aware ASCII terminal profile for Andrey Tvorozhkov and his AI Agents era questlines.",
  metadataBase: getMetadataBase(),
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <RouteTransitionProvider>{children}</RouteTransitionProvider>
      </body>
    </html>
  );
}
