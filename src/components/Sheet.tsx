"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";

// Open sheets, topmost last. Only the topmost sheet handles Escape and Tab.
const openSheets: symbol[] = [];

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet dialog. Stays mounted while its exit animation runs, so keep
 * `open` separate from the data it shows (the content must survive closing).
 */
export default function Sheet({
  open,
  onClose,
  title,
  description,
  trailing,
  showClose = true,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra header content shown before the close button (e.g. a total). */
  trailing?: React.ReactNode;
  showClose?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Mount on open; play the exit animation on close, then unmount.
  if (open && !rendered) setRendered(true);
  if (open && closing) setClosing(false);
  if (!open && rendered && !closing) setClosing(true);

  useEffect(() => {
    if (!rendered) return;
    const panel = panelRef.current;
    const token = Symbol("sheet");
    const previousFocus = document.activeElement as HTMLElement | null;
    openSheets.push(token);
    document.body.style.overflow = "hidden";
    // Focus the panel, not the first field, so iOS doesn't pop the keyboard.
    panel?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (openSheets[openSheets.length - 1] !== token || !panel) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openSheets.splice(openSheets.indexOf(token), 1);
      if (openSheets.length === 0) document.body.style.overflow = "";
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [rendered]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 ${closing ? "animate-scrim-out" : "animate-scrim-in"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && closing) {
            setRendered(false);
            setClosing(false);
          }
        }}
        className={`relative mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg outline-none ${
          closing ? "animate-sheet-out" : "animate-sheet-in"
        } ${className}`}
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-lg font-bold text-fg-base">{title}</h2>
            {description && <p id={descId} className="mt-0.5 text-sm text-fg-secondary">{description}</p>}
          </div>
          {trailing}
          {showClose && (
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-2 text-fg-muted">
              <X size={20} />
            </IconButton>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
