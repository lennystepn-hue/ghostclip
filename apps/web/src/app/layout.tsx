import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GhostClip — AI Clipboard Manager",
  description: "Dein AI-powered Clipboard Manager mit Cloud Sync",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className={`${inter.className} bg-surface-DEFAULT text-surface-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
