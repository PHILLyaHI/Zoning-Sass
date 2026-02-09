import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "What Can I Do On This Property?",
  description: "Zoning, utilities, risks, and AI answers with sources."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}



