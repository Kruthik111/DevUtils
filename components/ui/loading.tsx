import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  /**
   * Whether to show full screen loading (centered with min-h-screen)
   */
  fullScreen?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Size of the spinner (default: "default")
   */
  size?: "sm" | "default" | "lg";
}

export function Loading({ 
  text = "Loading...", 
  fullScreen = false,
  className,
  size = "default"
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const containerClasses = cn(
    "flex items-center justify-center",
    fullScreen && "min-h-screen p-8",
    !fullScreen && "p-8",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {text && (
          <p className={cn(
            "text-sm",
            fullScreen ? "text-muted-foreground" : "text-foreground/60"
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

