import { useTranslation } from "react-i18next";

import VerticalWheelPicker from "@/components/WheelPicker/VerticalWheelPicker";
import { LANGUAGE_OPTIONS } from "@/constants/settings";
import type { SupportedLocale } from "@/types/preferences.type";

interface LanguageStepProps {
  value: SupportedLocale;
  onChange: (locale: SupportedLocale) => void;
}

const WHEEL_ORDER: SupportedLocale[] = ["ja-JP", "zh-CN", "ko-KR", "en-US"];

const WHEEL_OPTIONS = WHEEL_ORDER.map(
  (locale) => LANGUAGE_OPTIONS.find((option) => option.value === locale)!,
);

function LanguageStep({ value, onChange }: LanguageStepProps) {
  const { t } = useTranslation();

  return (
    <VerticalWheelPicker<SupportedLocale>
      label={t("language.title")}
      options={WHEEL_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}

export default LanguageStep;
