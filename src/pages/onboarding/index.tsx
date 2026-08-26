import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { verifyAccessLink } from "@/apis/patient.api";
import { LOCALE_TO_API_LANGUAGE } from "@/constants/settings";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/constants/storageKey";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import type { SupportedLocale } from "@/types/preferences.type";

import BirthDateStep, { type BirthDate } from "./components/BirthDateStep";
import IntroStep from "./components/IntroStep";
import LanguageStep from "./components/LanguageStep";
import OnboardingLayout from "./components/OnboardingLayout";
import RegionStep from "./components/RegionStep";
import SplashStep from "./components/SplashStep";

const STEPS = ["splash", "intro", "language", "region", "birthDate"] as const;

type Step = (typeof STEPS)[number];

const DEFAULT_BIRTH_DATE: BirthDate = { year: 2000, month: 6, day: 6 };

// yyyy-MM-dd. API가 이 형식만 받음
function formatBirthDate({ year, month, day }: BirthDate): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const locale = usePreferencesStore((state) => state.locale);
  const timeZone = usePreferencesStore((state) => state.timeZone);
  const setLocale = usePreferencesStore((state) => state.setLocale);
  const setTimeZone = usePreferencesStore((state) => state.setTimeZone);

  const [stepIndex, setStepIndex] = useState(0);
  const [birthDate, setBirthDate] = useState(DEFAULT_BIRTH_DATE);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex];

  // 스플래시/인트로로는 돌아가지 않는다
  const canGoPrevious = stepIndex > 2;

  const goPrevious = () => setStepIndex((index) => index - 1);

  const goNext = async () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((index) => index + 1);
      return;
    }

    /*
      개발 중 백엔드 없이 화면을 확인할 수 있도록 둔 우회 경로.
      생년월일을 2000-01-01로 두면 인증 API를 호출하지 않고 바로 홈으로 넘어간다.
      배포 빌드(import.meta.env.DEV === false)에서는 동작 x
    */
    if (import.meta.env.DEV && formatBirthDate(birthDate) === "2000-01-01") {
      navigate("/home");
      return;
    }

    // 매직링크의 query parameter로 전달된 원본 토큰
    const token = searchParams.get("token");
    if (!token) {
      setVerifyError(t("verifyError"));
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const { accessToken } = await verifyAccessLink({
        token,
        birthDate: formatBirthDate(birthDate),
        language: LOCALE_TO_API_LANGUAGE[locale],
        timezoneId: timeZone,
      });

      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      navigate("/home");
    } catch {
      setVerifyError(t("verifyError"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLocaleChange = (nextLocale: SupportedLocale) => {
    void setLocale(nextLocale);
  };

  if (step === "splash" || step === "intro") {
    return (
      <div className="relative min-h-dvh overflow-hidden">
        <IntroStep onStart={goNext} />
        {step === "splash" && (
          <div className="fixed inset-y-0 left-1/2 z-50 w-full max-w-app -translate-x-1/2 overflow-hidden">
            <SplashStep onFinish={() => void goNext()} />
          </div>
        )}
      </div>
    );
  }

  return (
    <OnboardingLayout
      title={t(`${step}.title`)}
      description={t(`${step}.description`)}
      previousLabel={t("previous")}
      confirmLabel={t(`${step}.confirm`)}
      onPrevious={canGoPrevious ? goPrevious : undefined}
      onConfirm={() => void goNext()}
      isConfirmDisabled={isVerifying}
    >
      {step === "language" && (
        <LanguageStep value={locale} onChange={handleLocaleChange} />
      )}

      {step === "region" && (
        <RegionStep
          locale={locale}
          timeZone={timeZone}
          onTimeZoneChange={setTimeZone}
        />
      )}

      {step === "birthDate" && (
        <div className="flex flex-col items-center gap-4">
          <BirthDateStep value={birthDate} onChange={setBirthDate} />
          {verifyError && (
            <p className="text-caption text-center text-red-300">
              {verifyError}
            </p>
          )}
        </div>
      )}
    </OnboardingLayout>
  );
}

export default OnboardingPage;
