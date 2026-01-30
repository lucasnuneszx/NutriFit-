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
        background: `
          radial-gradient(ellipse 120% 100% at 0% 0%, rgba(57, 255, 136, 0.5) 0%, rgba(57, 255, 136, 0.15) 30%, transparent 60%),
          radial-gradient(ellipse 100% 120% at 100% 0%, rgba(0, 245, 255, 0.45) 0%, rgba(0, 245, 255, 0.12) 30%, transparent 60%),
          radial-gradient(ellipse 130% 100% at 50% 100%, rgba(57, 255, 136, 0.4) 0%, rgba(57, 255, 136, 0.12) 30%, transparent 60%),
          linear-gradient(135deg, #0a0a0a 0%, #0d1a1f 20%, #0f1a1a 40%, #0a0f1a 60%, #0f1a1a 80%, #0a0a0a 100%)
        `,
        backgroundAttachment: 'fixed',
        backgroundSize: '100% 100%'
      }}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{ 
          backgroundColor: 'transparent',
          margin: 0,
          padding: 0,
          minHeight: '100vh'
        }}
      >
        {children}
      </body>
    </html>
  );
}
