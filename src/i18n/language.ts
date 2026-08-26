import { LOCALE_STORAGE_KEY } from "@/constants/storageKey";
import {
  isSupportedLocale,
  type SupportedLocale,
} from "@/types/preferences.type";

//브라우저 언어 감지 및 데이터 정규화 함수
export function resolveSupportedLocale(
  languages: readonly string[] = navigator.languages,
): SupportedLocale {
  for (const language of languages) {
    const normalized = language.toLowerCase();

    if (normalized.startsWith("ko")) {
      return "ko-KR";
    }

    if (normalized.startsWith("ja")) {
      return "ja-JP";
    }

    if (normalized.startsWith("zh")) {
      return "zh-CN";
    }

    if (normalized.startsWith("en")) {
      return "en-US";
    }
  }

  return "en-US";
}

export function getInitialLocale(): SupportedLocale {
  const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);

  return isSupportedLocale(savedLocale)
    ? savedLocale
    : resolveSupportedLocale();
}
