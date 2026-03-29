import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cric No-It-All",
  description: "Intelligent cricket analytics for men's international cricket",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-lavender-cream text-lavender-dark antialiased">{children}</body>
    </html>
  );
}
