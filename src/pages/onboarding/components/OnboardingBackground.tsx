import bgStripe from "@/assets/onboarding/bg-stripe.png";
import glow1 from "@/assets/onboarding/glow-1.svg";
import glow2 from "@/assets/onboarding/glow-2.svg";
import glow3 from "@/assets/onboarding/glow-3.svg";
import glow4 from "@/assets/onboarding/glow-4.svg";
import glow5 from "@/assets/onboarding/glow-5.svg";
import glow6 from "@/assets/onboarding/glow-6.svg";
import glow8 from "@/assets/onboarding/glow-8.svg";

// 피그마 245:4494(언어 선택 화면) 기준, 393x852 프레임 좌표.
// 각 글로우는 wrapper 박스가 아니라 inset(-N%)만큼 부풀려진 실제 블러 크기를 써야 한다.
interface Glow {
  src: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotate: number;
}

const GLOWS: Glow[] = [
  { src: glow1, centerX: 164, centerY: 313, width: 340, height: 332, rotate: 116.71 },
  { src: glow2, centerX: 197, centerY: 183, width: 650, height: 650, rotate: 180 },
  { src: glow4, centerX: 197, centerY: 672, width: 650, height: 650, rotate: 0 },
  { src: glow8, centerX: 196, centerY: 465, width: 460, height: 620, rotate: 90 },
  { src: glow3, centerX: 196, centerY: 465, width: 360, height: 351, rotate: 90 },
  { src: glow5, centerX: 134, centerY: 608, width: 413, height: 542, rotate: 93.91 },
  { src: glow6, centerX: 196, centerY: 840, width: 646, height: 696, rotate: 90 },
];

function OnboardingBackground() {
  return (
    <div
      aria-hidden
      className="bg-onboarding-bg pointer-events-none absolute inset-0 overflow-hidden"
    >
      <img
        src={bgStripe}
        alt=""
        className="absolute w-full object-cover opacity-80"
        style={{ left: 0, top: 0, height: "72.07%" }}
      />

      <div
        className="absolute w-full bg-linear-to-t from-transparent to-[#dedbf8] to-[60.866%] opacity-80"
        style={{ left: 0, top: "72.07%", height: "24.65%" }}
      />

      {GLOWS.map((glow, index) => (
        <img
          key={index}
          src={glow.src}
          alt=""
          className="absolute max-w-none"
          style={{
            left: `${(glow.centerX / 393) * 100}%`,
            top: `${(glow.centerY / 852) * 100}%`,
            width: `${(glow.width / 393) * 100}%`,
            height: `${(glow.height / 852) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${glow.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default OnboardingBackground;
