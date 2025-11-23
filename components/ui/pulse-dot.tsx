"use client";

import { cn } from "@/lib/utils";

interface PulseDotProps {
  isOnline: boolean;
  className?: string;
}

export function PulseDot({ isOnline, className }: PulseDotProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className={cn(
          "w-3 h-3 rounded-full transition-all duration-300",
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
      >
        {isOnline && (
          <>
            {/* Pulsing animation */}
            <div
              className={cn(
                "absolute inset-0 rounded-full animate-ping",
                isOnline ? "bg-green-500" : ""
              )}
              style={{ animation: isOnline ? "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" : "none" }}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full animate-pulse",
                isOnline ? "bg-green-500 opacity-75" : ""
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}

