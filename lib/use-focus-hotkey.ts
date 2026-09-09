"use client";

import { useEffect } from "react";

/** Shift+<key> focuses the last visible element matching `selector`. Ignored while typing. */
export function useFocusHotkey(key: string, selector: string, before?: () => void, after?: (el: HTMLElement) => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.key !== key) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")) return;

      before?.();
      requestAnimationFrame(() => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(selector))
          .filter((el) => el.offsetParent !== null);
        const el = els.at(-1);
        el?.focus();
        if (el) after?.(el);
      });
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}
