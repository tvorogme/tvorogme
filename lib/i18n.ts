export const SITE_LANGUAGE_COOKIE = "tvorogme-language";
export const SITE_LANGUAGE_STORAGE_KEY = "tvorogme-language";
export const DEFAULT_SITE_LANGUAGE = "en";

export const SITE_LANGUAGE_OPTIONS = [
  { htmlLang: "en", label: "English", shortLabel: "EN", value: "en" },
  { htmlLang: "ru", label: "Russian", shortLabel: "RU", value: "ru" },
  { htmlLang: "zh-CN", label: "中文", shortLabel: "中文", value: "zh" },
] as const;

export type SiteLanguage = (typeof SITE_LANGUAGE_OPTIONS)[number]["value"];

const SITE_LANGUAGE_SET = new Set<string>(
  SITE_LANGUAGE_OPTIONS.map((language) => language.value),
);

export function isSiteLanguage(value: string | null): value is SiteLanguage {
  return Boolean(value && SITE_LANGUAGE_SET.has(value));
}

export function getSiteLanguageHtmlLang(language: SiteLanguage) {
  return (
    SITE_LANGUAGE_OPTIONS.find((option) => option.value === language)
      ?.htmlLang ?? "en"
  );
}

export function normalizeSiteLanguage(value: string | null | undefined) {
  if (!value) return null;

  for (const rawCandidate of value.split(",")) {
    const candidate = rawCandidate
      .split(";")[0]
      .trim()
      .replaceAll("_", "-")
      .toLocaleLowerCase();

    if (isSiteLanguage(candidate)) return candidate;
    if (candidate.startsWith("ru-")) return "ru";
    if (candidate.startsWith("zh-")) return "zh";
    if (candidate.startsWith("en-")) return "en";
  }

  return null;
}
