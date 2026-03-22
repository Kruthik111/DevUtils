"use client";

import { NoteSkeleton } from "./note-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function NotesPageSkeleton() {
  return (
    <div className="p-2 md:p-4 min-h-screen animate-in fade-in duration-500">
      <div className="w-full mx-auto">
        {/* Tab Bar Skeleton */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <Skeleton className="w-24 h-10 rounded-xl shrink-0" />
          <Skeleton className="w-24 h-10 rounded-xl shrink-0" />
          <Skeleton className="w-24 h-10 rounded-xl shrink-0" />
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        </div>

        {/* Tools Bar Skeleton */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Skeleton className="flex-1 min-w-[200px] h-10 rounded-lg" />
          <div className="hidden md:flex gap-1">
            <Skeleton className="w-18 h-10 rounded-lg" />
          </div>
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-32 h-10 rounded-lg" />
          <Skeleton className="w-40 h-10 rounded-lg" />
        </div>

        {/* Notes Grid Skeleton */}
        <div className={cn(
          "grid gap-4 md:gap-6",
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {[...Array(6)].map((_, i) => (
            <NoteSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
