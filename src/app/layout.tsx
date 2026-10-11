import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GenomeAI — Genomics Anomaly Detection Using Apache Spark",
  description:
    "Explore genomic data at scale. Use distributed processing and machine learning to identify unusual sequence patterns and gain meaningful analytical insights.",
  keywords: [
    "Genomics",
    "Anomaly Detection",
    "Apache Spark",
    "PySpark",
    "Bioinformatics",
    "Machine Learning",
    "GenomeAI",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased flex flex-col selection:bg-[#8B5CF6] selection:text-white">
        {children}
      </body>
    </html>
  );
}
