import medicalDocIcon from "@/assets/aftercare/medical-doc.svg";

interface ReportCardProps {
  label: string;
  title: string;
  description: string;
  onClick: () => void;
}

function ReportCard({ label, title, description, onClick }: ReportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundImage:
          "radial-gradient(ellipse 50% 50% at 50% 50%, #a4c6cb 0%, #bcd7db 46%, #cfe6e8 100%)",
      }}
      className="w-full rounded-[28px] p-5 text-left min-h-[174px]"
    >
      <span className="flex items-center gap-2.5">
        <img aria-hidden src={medicalDocIcon} alt="" className="size-6" />
        <span className="text-report-label text-[0.9375rem] font-medium tracking-tight">
          {label}
        </span>
      </span>

      <span className="text-care-title mt-[19px] block text-2xl leading-[1.45] font-semibold tracking-tight">
        {title}
      </span>

      <span className="text-care-note text-caption mt-2 block leading-[1.45] font-normal">
        {description}
      </span>
    </button>
  );
}

export default ReportCard;
