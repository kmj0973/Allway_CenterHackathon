import { useTranslation } from "react-i18next";

interface HomeTutorialProps {
  onNext: () => void;
}

/*
  홈 화면 위에 덮는 어두운 오버레이. 화면 아무 곳이나 탭하면 다음 단계로 넘어간다.
  단계별 화살표·설명 텍스트는 여기서 그리지 않는다. 실제 강조 대상(사이드바, 채팅바,
  카드) 옆에 TutorialCallout으로 붙여야 화면 높이가 피그마 시안(852px)과 달라져도
  대상과의 상대 위치가 어긋나지 않는다.
*/
function HomeTutorial({ onNext }: HomeTutorialProps) {
  const { t } = useTranslation("home");

  return (
    <button
      type="button"
      aria-label={t("tutorial.skip")}
      onClick={onNext}
      className="bg-neutral-black/78 absolute inset-0 z-40 cursor-default text-left"
    />
  );
}

export default HomeTutorial;
