import alertIcon from "@/assets/aftercare/alert.svg";

interface AlertCardProps {
  title: string;
  items: string[];
}

function AlertCard({ title, items }: AlertCardProps) {
  return (
    <section className="bg-alert-bg mx-5 mt-6 rounded-3xl p-5">
      <h2 className="text-care-title flex items-center gap-1.5 text-body font-medium">
        {/* 아이콘 뒤에서 번져 나가는 맥박. 시선이 먼저 닿아야 하는 경고라 움직임을 준다 */}
        <span aria-hidden className="relative flex size-6 shrink-0">
          <span className="bg-alert-icon absolute inline-flex size-full animate-ping rounded-full opacity-50" />
          <img src={alertIcon} alt="" className="relative size-full" />
        </span>
        {title}
      </h2>

      <ul className="text-notice-text mt-4.5 flex list-disc flex-col gap-1 ps-5.5 text-[0.9375rem] leading-[1.4] font-medium">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default AlertCard;
