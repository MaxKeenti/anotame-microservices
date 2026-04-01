import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anotame | Premium Tailor Management",
  description: "Modern management for modern tailors.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} antialiased`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Anotame" />
      </head>
      <body className="bg-background text-foreground font-sans min-h-screen selection:bg-primary selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
