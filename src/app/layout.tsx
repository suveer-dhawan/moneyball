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
  title: "Moneyball",
  description: "Fast, mobile-first personal budgeting",
};

export const viewport = {
  themeColor: '#f9fafb',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Reads localStorage before first paint to avoid theme flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=localStorage.getItem('moneyball-theme')||'system';document.documentElement.dataset.theme=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;}catch(e){}})();` }} />
        {children}
      </body>
    </html>
  );
}
