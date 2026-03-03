import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "On The Fritz | Your productivity is about to be On The Fritz",
  description: "Vintage arcade games, AI argument decider, world webcams, live chat and more. Your productivity is about to be On The Fritz.",
  keywords: "arcade games, time wasting, fun, breakout, snake, AI argument decider, webcams",
  openGraph: {
    title: "On The Fritz",
    description: "Your productivity is about to be On The Fritz",
    url: "https://onthefritz.us",
    siteName: "On The Fritz",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
