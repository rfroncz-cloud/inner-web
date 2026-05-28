"use client";

import { useEffect, type ReactNode } from "react";

type SideDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function SideDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: SideDrawerProps) {
  // ESC to close.
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll while a drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={`
          fixed inset-0 z-40 bg-black/45 backdrop-blur-sm
          transition-opacity duration-500
          ${open ? "opacity-100" : "pointer-events-none opacity-0"}
        `}
      />

      <aside
        aria-hidden={!open}
        className={`
          fixed top-0 right-0 z-50 h-screen
          flex flex-col
          w-screen sm:w-[420px]
          border-l border-white/5
          bg-gradient-to-b from-[#0a0a0e]/95 via-[#08080b]/95 to-black/95
          backdrop-blur-2xl
          shadow-[0_0_120px_rgba(139,92,246,0.16)]
          transition-transform duration-700 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="shrink-0 px-7 pt-7 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-violet-200/55">
                {title}
              </p>
              {subtitle && (
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/45">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/55 transition hover:bg-white/[0.08] hover:text-white"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-10">
          {children}
        </div>
      </aside>
    </>
  );
}
