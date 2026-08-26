export const supportedLocales = [
  "ko-KR",
  "en-US",
  "ja-JP",
  "zh-CN",
] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === "string" &&
    supportedLocales.includes(value as SupportedLocale)
  );
}

export interface UserPreferences {
  locale: SupportedLocale;
  timeZone: string;
}
