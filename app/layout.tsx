import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ChatWidget } from "@/components/ai/ChatWidget";
import { Footer } from "@/components/ui/Footer";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Navbar } from "@/components/ui/Navbar";
import { AppProviders } from "@/components/providers/AppProviders";
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
  title: "Nexora",
  description: "Premium dark e-ticaret deneyimi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a0a] text-white">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <DemoBanner />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="top-right" />
            <ChatWidget />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
