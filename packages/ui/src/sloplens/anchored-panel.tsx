import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";
import { SPRING_PANEL } from "@/lib/ease";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { cn } from "@/lib/utils";

export type AnchoredPanelSide = "top" | "bottom";

export function SlopLensAnchoredPanel({
  open,
  onOpenChange,
  trigger,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<AnchoredPanelSide>("top");

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useDismiss(open, close, rootRef, { behavior: "consume" });

  const place = useCallback(() => {
    const triggerBox = triggerRef.current?.getBoundingClientRect();
    if (!triggerBox) {
      return;
    }
    const estimatedHeight = panelRef.current?.offsetHeight ?? 280;
    const spaceAbove = triggerBox.top;
    const spaceBelow = window.innerHeight - triggerBox.bottom;
    if (spaceAbove < estimatedHeight + 12 && spaceBelow > spaceAbove) {
      setSide("bottom");
    } else {
      setSide("top");
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    place();
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  return (
    <div ref={rootRef} className="relative inline-flex max-w-full flex-col items-start">
      <div ref={triggerRef}>{trigger}</div>
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            data-sloplens-panel="true"
            data-sloplens-panel-side={side}
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, y: side === "top" ? 10 : -10, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: side === "top" ? 8 : -8, scale: 0.98 }}
            transition={reduce ? { duration: 0 } : SPRING_PANEL}
            style={{ transformOrigin: side === "top" ? "bottom left" : "top left" }}
            className={cn(
              "absolute z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-x-hidden overflow-y-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl",
              side === "top" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]",
              className,
            )}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
