import { cn } from "@/utils/cn";

interface Point {
  top: number;
  left: number;
}

interface TutorialCalloutProps {
  /** 강조 대상 요소의 좌상단 위치 (페이지 루트 기준 px, getBoundingClientRect로 측정) */
  anchor: Point;
  arrowSrc: string;
  /** 화살표 중심점의, anchor로부터의 오프셋(px) */
  arrowOffset: Point;
  /** 화살표 회전 전 원본 크기(px). SVG가 preserveAspectRatio="none"이라 반드시 둘 다 지정해야 한다 */
  arrowSize: { width: number; height: number };
  /** rotate·scale 등 정적인 변형 클래스 */
  arrowTransformClassName: string;
  /** 텍스트 블록 좌상단의, anchor로부터의 오프셋(px) */
  textOffset: Point;
  textWidth: number;
  /** 제목-설명 간 줄 간격 클래스 (블록마다 피그마 값이 다르다) */
  textGapClassName: string;
  title: string;
  description: string;
  /** description에 \n으로 넣은 줄바꿈을 그대로 살릴지 여부 */
  preserveLineBreaks?: boolean;
  /** 제목이 textWidth보다 넓어져도 줄바꿈되지 않게 할지 여부 (피그마에서 한 줄로 고정된 제목) */
  titleNoWrap?: boolean;
}

/*
  강조 대상 요소 옆에 곡선 화살표 + 설명 텍스트를 붙이는 안내 말풍선.
  화면 높이가 피그마 시안(852px)과 달라져도, 또는 실제 데이터 길이가 시안 문구와
  달라져도 대상과의 상대 위치가 어긋나지 않도록, 정적인 %/px 좌표 대신
  getBoundingClientRect로 측정한 대상의 실제 위치(anchor)에 오프셋을 더해 배치한다.
*/
function TutorialCallout({
  anchor,
  arrowSrc,
  arrowOffset,
  arrowSize,
  arrowTransformClassName,
  textOffset,
  textWidth,
  textGapClassName,
  title,
  description,
  preserveLineBreaks,
  titleNoWrap,
}: TutorialCalloutProps) {
  return (
    <>
      <img
        aria-hidden
        src={arrowSrc}
        alt=""
        style={{
          top: anchor.top + arrowOffset.top,
          left: anchor.left + arrowOffset.left,
          width: arrowSize.width,
          height: arrowSize.height,
        }}
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2",
          arrowTransformClassName,
        )}
      />

      <span
        style={{
          top: anchor.top + textOffset.top,
          left: anchor.left + textOffset.left,
          width: textWidth,
        }}
        className={cn("absolute flex flex-col", textGapClassName)}
      >
        <span
          className={cn(
            "text-[1rem] leading-[1.4] font-semibold tracking-tight text-[#b4a0f5]",
            titleNoWrap && "whitespace-nowrap",
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "text-neutral-white text-[0.875rem] leading-[1.4] font-medium tracking-tight",
            preserveLineBreaks && "whitespace-pre-line",
          )}
        >
          {description}
        </span>
      </span>
    </>
  );
}

export default TutorialCallout;
