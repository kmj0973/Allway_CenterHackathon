import flagCn from "@/assets/settings/language/flag-cn.svg";
import flagJp from "@/assets/settings/language/flag-jp.svg";
import flagKr from "@/assets/settings/language/flag-kr.svg";
import flagUs from "@/assets/settings/language/flag-us.svg";
import type { SupportedLanguageLabel } from "@/types/patient.type";
import type { SupportedLocale } from "@/types/preferences.type";

export const LANGUAGE_OPTIONS: {
  value: SupportedLocale;
  label: string;
  flag: string;
}[] = [
  { value: "ko-KR", label: "한국어", flag: flagKr },
  { value: "ja-JP", label: "日本語", flag: flagJp },
  { value: "zh-CN", label: "中文", flag: flagCn },
  { value: "en-US", label: "English", flag: flagUs },
];

// API가 요구하는 한글 언어명으로 바꾼다.
export const LOCALE_TO_API_LANGUAGE: Record<
  SupportedLocale,
  SupportedLanguageLabel
> = {
  "ko-KR": "한국어",
  "en-US": "영어",
  "ja-JP": "일본어",
  "zh-CN": "중국어",
};

export function getTimezoneOptions() {
  return Intl.supportedValuesOf("timeZone").map((timezone) => ({
    value: timezone,
    label: timezone,
  }));
}
