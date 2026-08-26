import cardLayers from "@/assets/home/card-layers.svg";
import cardCamera from "@/assets/home/card-symbol-2.svg";
import { cn } from "@/utils/cn";

/*
  두 카드의 바탕은 같고, 오른쪽 위에 겹치는 장식만 다르다.
  장식은 overlay로 섞여 바탕보다 살짝 밝아 보이는 정도로만 드러난다.
  장식의 위치와 크기는 172x180 시안 기준 비율로 옮겼다.
*/
const VARIANTS = {
  consultation: {
    icon: cardCamera,
    iconClass: "top-[13.43%] left-[41.1%] w-[53.08%]",
    tint:
      "linear-gradient(215deg, var(--color-card-warm-from) 0%," +
      " var(--color-card-warm-mid) 50%, var(--color-card-warm-to) 100%)",
    cardClass: "",
    titleClass: "[text-shadow:0_4px_8.5px_rgba(0,0,0,0.07)]",
  },
  aftercare: {
    icon: cardLayers,
    iconClass: "top-[11.67%] left-[45.35%] w-[47.67%]",
    tint:
      "linear-gradient(160deg, var(--color-card-cool-from) 0%," +
      " var(--color-card-cool-mid) 45%, var(--color-card-cool-to) 100%)",
    cardClass: "shadow-[0_4px_8.5px_0_rgba(0,0,0,0.07)]",
    titleClass: "",
  },
} as const;

/* 시안의 카드 바탕. 색조 아래에 깔린다 */
const CARD_BASE =
  "radial-gradient(50% 50% at 50% 50%," +
  " rgba(237, 235, 245, 0.68) 29.41%, rgba(255, 255, 255, 0.68) 100%)";

interface HomeCardProps {
  badge: string;
  caption: string;
  title: string;
  variant?: keyof typeof VARIANTS;
  onClick: () => void;
}

function HomeCard({
  badge,
  caption,
  title,
  variant = "aftercare",
  onClick,
}: HomeCardProps) {
  const { icon, iconClass, tint, cardClass, titleClass } = VARIANTS[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: `${tint}, ${CARD_BASE}` }}
      className={cn(
        "relative flex h-45 flex-1 flex-col justify-between overflow-hidden rounded-3xl px-5 pt-5 pb-6 text-left backdrop-blur-[10.9px]",
        cardClass,
      )}
    >
      {/* 투명도는 내보낸 SVG에 이미 들어 있어 여기서 다시 주지 않는다 */}
      <img
        aria-hidden
        src={icon}
        alt=""
        className={cn(
          "pointer-events-none absolute mix-blend-overlay",
          iconClass,
        )}
      />

      <span className="text-caption relative leading-tight font-medium text-text-02">
        {badge}
      </span>

      <div className="relative flex flex-col gap-1.5">
        <span className="text-caption leading-tight text-text-muted">
          {caption}
        </span>
        <span
          className={cn(
            "text-heading font-semibold text-text-02",
            titleClass,
          )}
        >
          {title}
        </span>
      </div>
    </button>
  );
}

export default HomeCard;
