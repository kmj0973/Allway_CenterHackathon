import { useState } from "react";
import { useTranslation } from "react-i18next";

import { updatePatientSettings } from "@/apis/patient.api";
import check from "@/assets/settings/language/check.svg";
import { LANGUAGE_OPTIONS, LOCALE_TO_API_LANGUAGE } from "@/constants/settings";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/constants/storageKey";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import type { SupportedLocale } from "@/types/preferences.type";
import ConsultationHeader from "@/components/Header/ConsultationHeader";
import { useNavigate } from "react-router-dom";

function LanguageSettingsPage() {
  const { t } = useTranslation("settings");
  const navigate = useNavigate();

  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);

  const [pendingLocale, setPendingLocale] = useState<SupportedLocale | null>(
    null,
  );
  const [error, setError] = useState(false);

  const handleSelect = async (nextLocale: SupportedLocale) => {
    if (nextLocale === locale || pendingLocale) return;

    setPendingLocale(nextLocale);
    setError(false);

    try {
      // language claim이 JWT에 들어 있어, 성공하면 accessToken이 새로 발급된다
      const { accessToken } = await updatePatientSettings({
        language: LOCALE_TO_API_LANGUAGE[nextLocale],
      });

      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      await setLocale(nextLocale);
    } catch {
      setError(true);
    } finally {
      setPendingLocale(null);
    }
  };

  return (
    <div className="min-h-dvh bg-care-bg">
      <ConsultationHeader
        title={t("language.title")}
        onBack={() => navigate(-1)}
        className="bg-care-bg"
      />
      {error && (
        <p className="text-caption px-5 pb-2 text-red-500">
          {t("language.error")}
        </p>
      )}

      <ul className="mt-1.5">
        {LANGUAGE_OPTIONS.map((option) => {
          const isSelected = option.value === locale;

          return (
            <li key={option.value}>
              <button
                type="button"
                aria-current={isSelected}
                disabled={pendingLocale !== null}
                onClick={() => void handleSelect(option.value)}
                className="border-language-divider bg-care-bg flex h-15.5 w-full items-center justify-between border-t px-5 disabled:opacity-60"
              >
                <span className="flex items-center gap-3">
                  <img
                    aria-hidden
                    src={option.flag}
                    alt=""
                    className="h-6 w-9 rounded-[3px] shadow-[0_0_4px_rgba(0,0,0,0.25)]"
                  />
                  <span className="text-body font-medium tracking-tight text-text-language">
                    {option.label}
                  </span>
                </span>

                {isSelected && (
                  <img aria-hidden src={check} alt="" className="size-6" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default LanguageSettingsPage;
