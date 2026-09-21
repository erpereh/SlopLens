import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/motion/button/base";
import { useSlopLensI18n } from "@/i18n/context";
import { useSlopLensTheme } from "@/theme/context";
import type { ThemePreference } from "@/theme/types";

const iconByPreference: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function SlopLensThemeToggleButton() {
  const { t } = useSlopLensI18n();
  const { preference, cyclePreference } = useSlopLensTheme();
  const Icon = iconByPreference[preference];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("theme.toggle")}
      title={t(`theme.${preference}`)}
      onClick={cyclePreference}
    >
      <Icon className="size-4" aria-hidden />
    </Button>
  );
}
