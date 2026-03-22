import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "ThinklyBot — Your Automation Guide",
  description:
    "Enterprise AI CTO that audits back-office workflows and generates automated AI agent blueprints. Built by Thinkly Labs.",
  keywords: [
    "AI automation",
    "workflow audit",
    "AI agents",
    "enterprise AI",
    "Thinkly Labs",
  ],
  openGraph: {
    title: "Thinkly Labs — Workflow Auditor",
    description:
      "Describe a manual process. Our AI CTO will architect a reliable agent blueprint to automate it.",
    type: "website",
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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-black">
        {children}
      </body>
    </html>
  );
}
