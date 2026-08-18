import { useTranslation } from "react-i18next";

import pointer from "./tutorial-assets/pointer.svg";
import swipeHand from "./tutorial-assets/swipe-hand.svg";

interface HomeTutorialProps {
  /** 0: 채팅 내역·입력창 안내, 1: 사후관리·화상상담 카드 안내 */
  step: 0 | 1;
  onNext: () => void;
}

/*
  홈 화면 위에 덮는 2단계 안내. 화면 아무 곳이나 탭하면 다음 단계로 넘어간다.
  강조할 요소는 여기서 다시 그리지 않고, HomePage가 실제 요소를 이 오버레이 위로 올린다.
  좌표는 피그마 393x852 프레임 기준 비율로 옮겼다.
*/
function HomeTutorial({ step, onNext }: HomeTutorialProps) {
  const { t } = useTranslation("home");

  return (
    <button
      type="button"
      aria-label={t("tutorial.skip")}
      onClick={onNext}
      className="bg-neutral-black/78 absolute inset-0 z-40 cursor-default text-left"
    >
      {step === 0 ? (
        <>
          {/* 사이드바에서 오른쪽으로 스와이프하라는 손 모양 */}
          <span
            aria-hidden
            className="absolute top-[18.78%] left-[7.12%] h-[2.58%] w-[19.59%] rounded-[30px] bg-linear-to-l from-transparent to-white opacity-90"
          />
          <img
            aria-hidden
            src={swipeHand}
            alt=""
            className="absolute top-[19.01%] left-[15.52%] w-[17.05%] rotate-180"
          />

          <span className="absolute top-[18.54%] left-[33.59%] flex w-[39.44%] flex-col gap-0.5">
            <span className="text-[1rem] leading-[1.4] font-semibold tracking-tight text-[#b4a0f5]">
              {t("tutorial.history.title")}
            </span>
            <span className="text-neutral-white text-[0.875rem] leading-[1.4] font-medium tracking-tight whitespace-pre-line">
              {t("tutorial.history.description")}
            </span>
          </span>

          {/* 채팅 입력창을 가리키는 곡선 화살표 */}
          <img
            aria-hidden
            src={pointer}
            alt=""
            className="absolute top-[59.4%] left-[46.39%] w-[7.46%] -scale-y-100 rotate-[169.25deg]"
          />

          <span className="absolute top-[55.99%] left-[5.09%] flex w-[48.09%] flex-col gap-0.5">
            <span className="text-[1rem] leading-[1.4] font-semibold tracking-tight text-[#b4a0f5]">
              {t("tutorial.chat.title")}
            </span>
            <span className="text-neutral-white text-[0.875rem] leading-[1.4] font-medium tracking-tight">
              {t("tutorial.chat.description")}
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="absolute top-[48.71%] left-[50.38%] flex w-[58.02%] flex-col gap-0.5">
            <span className="text-[1rem] leading-[1.4] font-semibold tracking-tight text-[#b4a0f5]">
              {t("tutorial.aftercare.title")}
            </span>
            <span className="text-neutral-white text-[0.875rem] leading-[1.4] font-medium tracking-tight">
              {t("tutorial.aftercare.description")}
            </span>
          </span>

          <span className="absolute top-[59.39%] left-[5.09%] flex w-[47.58%] flex-col gap-0.5">
            <span className="text-[1rem] leading-[1.4] font-semibold tracking-tight text-[#b4a0f5]">
              {t("tutorial.consultation.title")}
            </span>
            <span className="text-neutral-white text-[0.875rem] leading-[1.4] font-medium tracking-tight">
              {t("tutorial.consultation.description")}
            </span>
          </span>

          {/* 화상 상담 카드를 가리키는 곡선 화살표 */}
          <img
            aria-hidden
            src={pointer}
            alt=""
            className="absolute top-[68.43%] left-[8.4%] w-[11.01%] rotate-[-72.67deg]"
          />
        </>
      )}
    </button>
  );
}

export default HomeTutorial;
