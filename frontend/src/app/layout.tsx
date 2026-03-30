import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Melow Sales Intelligence",
  description: "AI-powered sales call analysis and deal room generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
