"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NoteSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export function NoteSkeleton({ viewMode = 'grid' }: NoteSkeletonProps) {
  return (
    <div className="group relative">
      <div className={cn(
        "bg-background/80 backdrop-blur-xl border border-border/30 overflow-hidden relative",
        viewMode === 'grid' ? "rounded-xl md:rounded-2xl" : "rounded-lg"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border/20">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="w-32 h-6 md:h-7" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="w-8 h-8 rounded-md" />
          </div>
        </div>

        {/* Body Blocks */}
        <div className="px-3 py-4 space-y-3">
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-4/5 h-10 rounded-lg opacity-80" />
          <Skeleton className="w-3/4 h-10 rounded-lg opacity-60" />
        </div>

        {/* Footer */}
        <div className="px-3 pb-3">
          <Skeleton className="w-full h-10 rounded-lg border border-dashed border-border/40" />
        </div>
      </div>
    </div>
  );
}
