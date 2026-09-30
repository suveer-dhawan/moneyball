"use client";

import { useEffect, useState } from "react";

/** Sticky screen title below the status bar; a hairline appears once content scrolls under it. */
export default function ScreenHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors ${
        scrolled ? "border-line-default" : "border-transparent"
      }`}
    >
      <div className="flex h-14 items-center justify-between gap-3 px-5">
        <h1 className="truncate text-2xl font-bold tracking-tight text-fg-base">{title}</h1>
        {trailing}
      </div>
    </header>
  );
}
