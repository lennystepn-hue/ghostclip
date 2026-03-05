import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GhostClip — AI Clipboard Manager",
  description: "Dein AI-powered Clipboard Manager mit Cloud Sync, E2E Encryption, Cross-Platform",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
