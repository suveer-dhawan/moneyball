import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moneyball",
  description: "Fast, mobile-first personal budgeting",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moneyball",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

// Initial values match --surface for light and dark; useTheme keeps these
// tags in sync with the chosen theme (including Warm) after load.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint: applies the saved theme and matching status bar color.
const themeBootScript = `(function(){try{var p=localStorage.getItem('moneyball-theme')||'system';var t=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;var d=document.documentElement;d.dataset.theme=t;var c=getComputedStyle(d).getPropertyValue('--surface').trim();if(c)document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',c);});}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
      </body>
    </html>
  );
}
