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

// A single theme-color tag (no media variants) that the boot script and
// useTheme overwrite with the active theme's --surface.
export const viewport: Viewport = {
  themeColor: "#f9fafb",
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
        {/* Solid theme color behind the notch/status bar. iOS 26 Safari tints the
            status bar from fixed elements at the top rather than theme-color. */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-[env(safe-area-inset-top)] bg-surface" />
        {children}
      </body>
    </html>
  );
}
