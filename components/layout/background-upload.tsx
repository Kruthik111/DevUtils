"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const BACKGROUND_KEY = "devutils-background-path";

interface BackgroundUploadProps {
  onClose?: () => void;
}

export function BackgroundUpload({ onClose }: BackgroundUploadProps) {
  const [backgroundPath, setBackgroundPath] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(BACKGROUND_KEY);
      if (stored) {
        setBackgroundPath(stored);
        applyBackground(stored);
        setPreviewUrl(stored);
      }
    }
  }, []);

  const applyBackground = (path: string) => {
    if (typeof document !== "undefined" && path) {
      const body = document.body;
      body.style.backgroundImage = `url(${path})`;
      body.style.backgroundSize = "contain";
      body.style.backgroundPosition = "center";
      body.style.backgroundRepeat = "no-repeat";
      body.style.backgroundAttachment = "fixed";
    }
  };

  const handlePathChange = (path: string) => {
    setBackgroundPath(path);
    if (path) {
      // Test if the image loads
      const img = new Image();
      img.onload = () => {
        setPreviewUrl(path);
        applyBackground(path);
        localStorage.setItem(BACKGROUND_KEY, path);
      };
      img.onerror = () => {
        alert("Invalid image path. Please check the URL or file path.");
        setPreviewUrl(null);
      };
      img.src = path;
    } else {
      setPreviewUrl(null);
      removeBackground();
    }
  };

  const handleApply = () => {
    if (backgroundPath.trim()) {
      handlePathChange(backgroundPath.trim());
    } else {
      removeBackground();
    }
  };

  const removeBackground = () => {
    if (typeof document !== "undefined") {
      const body = document.body;
      body.style.backgroundImage = "";
      body.style.backgroundSize = "";
      body.style.backgroundPosition = "";
      body.style.backgroundRepeat = "";
      body.style.backgroundAttachment = "";
    }
    setBackgroundPath("");
    setPreviewUrl(null);
    localStorage.removeItem(BACKGROUND_KEY);
  };

  return (
    <div className="pt-3 border-t border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Background Image</h4>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-foreground/60" />
          <input
            type="text"
            value={backgroundPath}
            onChange={(e) => setBackgroundPath(e.target.value)}
            placeholder="Enter image URL or file path"
            className={cn(
              "flex-1 px-3 py-2 rounded-xl text-sm",
              "bg-background/50 border border-border/50",
              "focus:outline-none focus:border-primary",
              "placeholder:text-foreground/40"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleApply();
              }
            }}
          />
        </div>

        <button
          onClick={handleApply}
          className={cn(
            "w-full px-4 py-2 rounded-xl text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-all"
          )}
        >
          Apply Background
        </button>

        {previewUrl && (
          <>
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border/50">
              <img
                src={previewUrl}
                alt="Background preview"
                className="w-full h-full object-cover"
                onError={() => {
                  setPreviewUrl(null);
                  alert("Failed to load image. Please check the path.");
                }}
              />
            </div>
            <button
              onClick={removeBackground}
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
  );
}

