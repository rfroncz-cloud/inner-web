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
          fixed top-0 right-0 z-50 h-[100dvh]
          flex flex-col
          w-full sm:w-[420px]
          border-l border-white/5
          bg-gradient-to-b from-[#0a0a0e]/97 via-[#08080b]/97 to-black/97
          backdrop-blur-2xl
          shadow-[0_0_120px_rgba(139,92,246,0.16)]
          transition-transform duration-500 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header — safe-area top padding for notched devices */}
        <div className="shrink-0 px-5 sm:px-7 pt-[max(1.75rem,env(safe-area-inset-top))] pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.32em] text-violet-200/55 truncate">
                {title}
              </p>
              {subtitle && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/40 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Large tap target on mobile */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] uppercase tracking-[0.22em] text-white/55 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable content — safe-area bottom padding */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </aside>
    </>
  );
}
