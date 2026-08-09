import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantEV — Find Charging Stations Near You",
  description:
    "Find the best EV charging locations near you in Shenzhen. Powered by AI demand prediction and quantum optimisation.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ height: "100%", margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
