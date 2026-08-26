import calendarIcon from "@/assets/aftercare/calendar.svg";
import chevronIcon from "@/assets/aftercare/chevron.svg";
import phaseMoonIcon from "@/assets/aftercare/phase-moon.svg";
import procedureIcon from "@/assets/aftercare/procedure.svg";
import { cn } from "@/utils/cn";

interface PhaseSummaryCardProps {
  label: string;
  headline: string;
  procedureDate: string;
  procedureName: string;
  isExpanded: boolean;
  toggleLabel: string;
  onToggle: () => void;
}

function PhaseSummaryCard({
  label,
  headline,
  procedureDate,
  procedureName,
  isExpanded,
  toggleLabel,
  onToggle,
}: PhaseSummaryCardProps) {
  return (
    <section
      /*
      타원이 카드를 꽉 채워야 가운데 색이 산다.
      Tailwind 임의값에 넣으면 형태 지정이 빠져 farthest-corner로 퍼지므로 여기 둔다.
      */
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #d0c2ff 0%, #d5c8ff 46%, #e8e2ff 100%)",
      }}
      className="relative h-43 rounded-3xl px-5 pt-6 pb-5 min-h-[174px]"
    >
      <div className="flex items-center gap-2.5">
        <img aria-hidden src={phaseMoonIcon} alt="" className="size-6" />
        <span className="text-care-sub text-[0.9375rem] font-medium tracking-tight">
          {label}
        </span>
      </div>

      <h2 className="text-care-title mt-[19px] text-2xl leading-[1.45] font-semibold tracking-tight">
        {headline}
      </h2>

      <div className="mt-6.5 flex items-center pr-14">
        <div className="text-care-sub flex items-center gap-2.5 text-[0.9375rem] leading-[1.45] font-medium tracking-tight">
          <span className="flex items-center gap-1">
            <img aria-hidden src={calendarIcon} alt="" className="size-6" />
            {procedureDate}
          </span>

          <span aria-hidden className="bg-care-sub/30 h-4 w-px" />

          <span className="flex items-center gap-1">
            <img aria-hidden src={procedureIcon} alt="" className="size-6" />
            {procedureName}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label={toggleLabel}
        onClick={onToggle}
        className="absolute right-5 bottom-5 flex size-11 shrink-0 items-center justify-center rounded-full"
      >
        <img
          aria-hidden
          src={chevronIcon}
          alt=""
          className={cn(
            "size-6 transition-transform duration-200",
            // 원본은 오른쪽을 가리키는 꺾쇠라 반대로 돌려 쓴다
            isExpanded ? "-rotate-90" : "rotate-90",
          )}
        />
      </button>
    </section>
  );
}

export default PhaseSummaryCard;
