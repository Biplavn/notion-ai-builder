import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BartlabsFooter } from "@/components/BartlabsFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NotionStruct",
  description: "Build professional Notion templates in seconds with AI",
  keywords: ["notion templates", "notion", "productivity", "templates", "notion marketplace", "habit tracker", "project tracker", "expense tracker", "bartlabs"],
  authors: [{ name: "Bartlabs" }],
  creator: "Bartlabs",
  publisher: "Bartlabs",
  openGraph: {
    title: "Bartlabs Notion Templates - Premium Templates & AI Generator",
    description: "Discover premium Notion templates. One-click installation. Free & Pro templates for productivity, finance, health, and more.",
    url: "https://bartlabs.in",
    siteName: "Bartlabs Notion Templates",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bartlabs Notion Templates",
    description: "Premium Notion templates with one-click installation",
    creator: "@bartlabs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
          <BartlabsFooter />
        </div>
      </body>
    </html>
  );
}
