import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantEV — Smarter EV Infrastructure",
  description:
    "AI-powered demand prediction combined with quantum optimization to identify where EV charging stations should be built next.",
  openGraph: {
    title: "QuantEV",
    description: "Find where the next charging stations should go.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full">{children}</body>
    </html>
  );
}
