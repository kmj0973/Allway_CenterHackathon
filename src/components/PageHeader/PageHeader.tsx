import { useNavigate } from "react-router-dom";

import chevronLeft from "@/assets/common/chevron-left.svg";

interface PageHeaderProps {
  title: string;
  backLabel: string;
}

function PageHeader({ title, backLabel }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="relative flex h-16 items-center px-5">
      <button
        type="button"
        aria-label={backLabel}
        onClick={() => navigate(-1)}
        className="flex size-6 items-center justify-center"
      >
        <img aria-hidden src={chevronLeft} alt="" className="size-6" />
      </button>

      <h1 className="text-heading ml-3 font-semibold text-text-01">{title}</h1>
    </header>
  );
}

export default PageHeader;
