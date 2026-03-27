import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Extract localized name from content JSON { zh: { name: "..." }, en: { name: "..." } }
export function getLocalizedName(
  content: Record<string, { name?: string }> | unknown,
  lang: "zh" | "en" = "zh"
): string {
  const c = content as Record<string, { name?: string }> | null;
  if (!c) return "";
  return c[lang]?.name || c[lang === "zh" ? "en" : "zh"]?.name || "";
}

export function getLocalizedDesc(
  content: Record<string, { description?: string }> | unknown,
  lang: "zh" | "en" = "zh"
): string {
  const c = content as Record<string, { description?: string }> | null;
  if (!c) return "";
  return c[lang]?.description || c[lang === "zh" ? "en" : "zh"]?.description || "";
}
