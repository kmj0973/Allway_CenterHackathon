import { useTranslation } from "react-i18next";

import bgStripe from "@/assets/onboarding/bg-stripe.png";
import glow1 from "@/assets/onboarding/glow-1.svg";
import glow2 from "@/assets/onboarding/glow-2.svg";
import glow3 from "@/assets/onboarding/glow-3.svg";
import glow5 from "@/assets/onboarding/glow-5.svg";

interface IntroStepProps {
  onStart: () => void;
}

interface Glow {
  src: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotate: number;
}

const GLOWS: Glow[] = [
  {
    src: glow1,
    centerX: 164.4,
    centerY: 329.6,
    width: 340,
    height: 332,
    rotate: 116.71,
  },
  {
    src: glow5,
    centerX: 133.5,
    centerY: 625.5,
    width: 413,
    height: 542,
    rotate: 93.91,
  },
  {
    src: glow2,
    centerX: 247.7,
    centerY: 427.7,
    width: 432.7,
    height: 331.6,
    rotate: 116.71,
  },
  {
    src: glow3,
    centerX: 196,
    centerY: 840,
    width: 645.6,
    height: 695.6,
    rotate: 90,
  },
];

function IntroStep({ onStart }: IntroStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-onboarding-bg relative flex min-h-dvh flex-col overflow-hidden">
      <img
        aria-hidden
        src={bgStripe}
        alt=""
        className="pointer-events-none absolute w-full object-cover"
        style={{ left: 0, top: 0, height: "72.07%" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute w-full bg-linear-to-t from-transparent to-[#dedbf8] to-[60.866%]"
        style={{ left: 0, top: "72.07%", height: "24.65%" }}
      />

      {GLOWS.map((glow, index) => (
        <img
          key={index}
          aria-hidden
          src={glow.src}
          alt=""
          className="pointer-events-none absolute max-w-none"
          style={{
            left: `${(glow.centerX / 393) * 100}%`,
            top: `${(glow.centerY / 852) * 100}%`,
            width: `${(glow.width / 393) * 100}%`,
            height: `${(glow.height / 852) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${glow.rotate}deg)`,
          }}
        />
      ))}

      <div className="onboarding-intro-copy relative mt-auto flex flex-col gap-3 px-5">
        <h1 className="font-display text-onboarding-title text-[2.5rem] leading-[1.4] font-medium tracking-tight whitespace-pre-line">
          {t("intro.title")}
        </h1>
        <p className="text-text-sub text-[0.9375rem] leading-[1.6] font-medium tracking-tight whitespace-pre-line opacity-80">
          {t("intro.description")}
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="onboarding-intro-button text-onboarding-title text-body bg-surface-soft relative mx-5 mt-11 mb-15.5 h-15.5 rounded-full font-semibold"
      >
        {t("intro.start")}
      </button>
    </div>
  );
}

export default IntroStep;
