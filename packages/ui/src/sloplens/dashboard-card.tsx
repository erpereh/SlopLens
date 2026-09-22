import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      data-sloplens-dashboard-card="true"
    >
      {title || description || action ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? <h3 className="text-sm font-medium text-foreground">{title}</h3> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
