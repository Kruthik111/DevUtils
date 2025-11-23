"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

const Tooltip = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange,
  delayDuration = 300 
}: TooltipProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }, [isControlled, onOpenChange]);

  const handleMouseEnter = React.useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, delayDuration);
  }, [delayDuration, setOpen]);

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(false);
  }, [setOpen]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const contextValue = React.useMemo(() => ({ 
    open, 
    setOpen,
    triggerRef 
  }), [open, setOpen]);

  return (
    <TooltipContext.Provider value={contextValue}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative inline-block"
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
};

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLElement) => {
          if (context?.triggerRef) {
            (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLElement | null>).current = node;
          }
          // Also set ref on the original element if it has one
          const originalRef = (children as any).ref;
          if (originalRef) {
            if (typeof originalRef === 'function') {
              originalRef(node);
            } else {
              originalRef.current = node;
            }
          }
        },
        className: cn(className, (children as any).props?.className),
        ...props,
        ...(children as any).props,
      });
    }

    return (
      <div 
        ref={ref as React.Ref<HTMLDivElement>} 
        className={cn("inline-block", className)} 
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

    React.useEffect(() => {
      if (!context?.open || !contentRef.current || !context.triggerRef.current) {
        setPosition(null);
        return;
      }

      const updatePosition = () => {
        const trigger = context.triggerRef.current;
        const content = contentRef.current;
        if (!trigger || !content) return;

        const triggerRect = trigger.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let top = 0;
        let left = 0;

        switch (side) {
          case "top":
            top = triggerRect.top + scrollY - contentRect.height - sideOffset;
            left = triggerRect.left + scrollX + triggerRect.width / 2 - contentRect.width / 2;
            break;
          case "bottom":
            top = triggerRect.bottom + scrollY + sideOffset;
            left = triggerRect.left + scrollX + triggerRect.width / 2 - contentRect.width / 2;
            break;
          case "left":
            top = triggerRect.top + scrollY + triggerRect.height / 2 - contentRect.height / 2;
            left = triggerRect.left + scrollX - contentRect.width - sideOffset;
            break;
          case "right":
            top = triggerRect.top + scrollY + triggerRect.height / 2 - contentRect.height / 2;
            left = triggerRect.right + scrollX + sideOffset;
            break;
        }

        // Keep tooltip within viewport
        const padding = 8;
        if (left < padding) left = padding;
        if (left + contentRect.width > window.innerWidth - padding) {
          left = window.innerWidth - contentRect.width - padding;
        }
        if (top < padding) top = padding;
        if (top + contentRect.height > window.innerHeight - padding) {
          top = window.innerHeight - contentRect.height - padding;
        }

        setPosition({ top, left });
      };

      requestAnimationFrame(updatePosition);
      
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [context?.open, side, sideOffset, context?.triggerRef]);

    if (!context?.open || !position) {
      return null;
    }

    return (
      <div
        ref={contentRef}
        className={cn(
          "fixed z-50 pointer-events-none",
          "overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
