import { cn } from "@/lib/utils";

export function PlatformMark({
  platform,
  className,
}: {
  platform: "x" | "youtube";
  className?: string;
}) {
  if (platform === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81zM9.75 15.57V8.43L15.84 12l-6.09 3.57z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.23 10.16 22.5 1h-1.96l-7.18 7.96L7.7 1H1.5l8.67 12.07L1.5 23h1.96l7.58-8.4L16.3 23h6.2zm-10.07-7.73h3.06l12.62 18.14h-3.06z"
      />
    </svg>
  );
}
