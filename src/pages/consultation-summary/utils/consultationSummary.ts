import type { SummaryRequestLanguage } from "@/types/consultation.type";
import type { SupportedLocale } from "@/types/preferences.type";

export function toSummaryRequestLanguage(
  locale: SupportedLocale,
): SummaryRequestLanguage {
  switch (locale) {
    case "en-US":
      return "EN";
    case "ja-JP":
      return "JA";
    case "zh-CN":
      return "ZH";
    default:
      return "KO";
  }
}

export const consultationSummaryQueryKey = (
  summaryId: number,
  language: SummaryRequestLanguage,
) => ["consultation-summary", summaryId, language] as const;

export const consultationSummaryListQueryKey = (
  language: SummaryRequestLanguage,
) => ["consultation-summaries", language] as const;
