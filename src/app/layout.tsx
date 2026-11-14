import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

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
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('genome_theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased flex flex-col selection:bg-[#8B5CF6] selection:text-white transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
