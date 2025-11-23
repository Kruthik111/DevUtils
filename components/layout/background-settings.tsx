"use client";

import { useState, useRef, useEffect } from "react";
import { Image, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const BACKGROUND_KEY = "devutils-background";

export function BackgroundSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(BACKGROUND_KEY);
      if (stored) {
        setBackgroundUrl(stored);
        applyBackground(stored);
      }
    }
  }, []);

  const applyBackground = (url: string) => {
    if (typeof document !== "undefined") {
      const body = document.body;
      body.style.backgroundImage = `url(${url})`;
      body.style.backgroundSize = "contain";
      body.style.backgroundPosition = "center";
      body.style.backgroundRepeat = "no-repeat";
      body.style.backgroundAttachment = "fixed";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image or gif
      if (!file.type.startsWith("image/")) {
        alert("Please select an image or GIF file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setBackgroundUrl(url);
        applyBackground(url);
        localStorage.setItem(BACKGROUND_KEY, url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    if (typeof document !== "undefined") {
      const body = document.body;
      body.style.backgroundImage = "";
      body.style.backgroundSize = "";
      body.style.backgroundPosition = "";
      body.style.backgroundRepeat = "";
      body.style.backgroundAttachment = "";
    }
    setBackgroundUrl(null);
    localStorage.removeItem(BACKGROUND_KEY);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl",
          "bg-background/50 hover:bg-background/80",
          "border border-border/50",
          "transition-all duration-200 hover:scale-105 active:scale-95"
        )}
        title="Background Settings"
      >
        <Image className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Background</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-background/80 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="background-upload"
            />
            <label
              htmlFor="background-upload"
              className={cn(
                "flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl",
                "bg-primary/10 hover:bg-primary/20 border border-primary/20",
                "transition-all cursor-pointer text-sm font-medium"
              )}
            >
              <Upload className="w-4 h-4" />
              Upload Image/GIF
            </label>

            {backgroundUrl && (
              <>
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border/50">
                  <img
                    src={backgroundUrl}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleRemove}
                  className={cn(
                    "w-full px-4 py-2 rounded-xl",
                    "bg-destructive/10 hover:bg-destructive/20 border border-destructive/20",
                    "transition-all text-sm font-medium text-destructive"
                  )}
                >
                  Remove Background
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

