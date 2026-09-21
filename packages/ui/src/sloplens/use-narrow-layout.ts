import { useEffect, useState } from "react";
import { NARROW_LAYOUT_MAX_WIDTH } from "./types";

export function useNarrowLayout(breakpoint = NARROW_LAYOUT_MAX_WIDTH): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
  );

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setNarrow(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [breakpoint]);

  return narrow;
}
