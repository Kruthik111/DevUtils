"use client";

import { cn } from "@/lib/utils";

interface LightbulbIconProps {
  isOn: boolean;
  className?: string;
}

export function LightbulbIcon({ isOn, className }: LightbulbIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-5 h-5", className)}
    >
      {/* Bulb shape */}
      <path
        d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z"
        className={isOn ? "fill-current opacity-100" : "opacity-40"}
      />
      {/* Base */}
      <path d="M9 18v3M15 18v3" />
      {/* Filament lines when on */}
      {isOn && (
        <>
          <line x1="12" y1="9" x2="12" y2="11" strokeWidth="1.5" />
          <line x1="10" y1="10" x2="11" y2="11" strokeWidth="1.5" />
          <line x1="14" y1="10" x2="13" y2="11" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

