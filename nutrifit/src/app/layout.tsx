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
  title: "NutriFit+",
  description:
    "NutriFit+ — plataforma de saúde de alta performance, futurista e gamificada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="pt-BR" 
      className="dark"
      style={{
        margin: 0,
        padding: 0,
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1a15 20%, #0a0f1a 40%, #1a0a20 60%, #0a1515 80%, #0a0a0a 100%)',
        backgroundAttachment: 'fixed',
        backgroundSize: '100% 100%'
      }}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{ 
          backgroundColor: 'transparent',
          margin: 0,
          padding: 0
        }}
      >
        {children}
      </body>
    </html>
  );
}
