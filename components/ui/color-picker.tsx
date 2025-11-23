"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium min-w-[100px]">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "w-10 h-10 rounded-lg border-2 border-border/50",
            "hover:scale-105 active:scale-95 transition-all",
            "shadow-sm"
          )}
          style={{ backgroundColor: value }}
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-sm rounded-lg border border-border/50 bg-background/50"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

