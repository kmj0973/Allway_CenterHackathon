import { useTranslation } from "react-i18next";

import type { SymptomType } from "@/types/consultationReservation.type";
import { cn } from "@/utils/cn";

interface SymptomSectionProps {
  selectedSymptoms: SymptomType[];
  description: string;
  onToggleSymptom: (symptom: SymptomType) => void;
  onChangeDescription: (value: string) => void;
}

const MAX_DESCRIPTION_LENGTH = 500;
const symptomOptions: SymptomType[] = [
  "pain",
  "swelling",
  "redness",
  "heat",
  "bleeding",
  "itching",
  "bruise",
  "other",
];

export default function SymptomSection({
  selectedSymptoms,
  description,
  onToggleSymptom,
  onChangeDescription,
}: SymptomSectionProps) {
  const { t } = useTranslation("consultationReservation");

  return (
    <section className="mt-16">
      <header>
        <h2 className="text-text-01 text-xl font-semibold leading-[1.4] tracking-tight">
          {t("preConsultation.symptoms.title")}
        </h2>
        <p className="mt-1 text-[15px] leading-[1.4] tracking-tight text-text-secondary">
          {t("preConsultation.symptoms.description")}
        </p>
      </header>

      <div className="mt-5 grid grid-cols-4 gap-[7px]">
        {symptomOptions.map((symptom) => {
          const isSelected = selectedSymptoms.includes(symptom);

          return (
            <button
              key={symptom}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggleSymptom(symptom)}
              className={cn(
                "h-[52px] rounded-[30px] border text-sm leading-[1.4] tracking-tight transition-colors",
                isSelected
                  ? "border-action-secondary-text bg-action-secondary-text font-medium text-action-primary-text"
                  : "border-calendar-control-border bg-transparent font-normal text-action-secondary-text",
              )}
            >
              {t(`preConsultation.symptoms.options.${symptom}`)}
            </button>
          );
        })}
      </div>

      <div className="relative mt-[10px]">
        <textarea
          value={description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          aria-label={t("preConsultation.symptoms.inputLabel")}
          placeholder={t("preConsultation.symptoms.placeholder")}
          onChange={(event) => onChangeDescription(event.target.value)}
          className={cn(
            "w-full resize-none rounded-[18px] border border-calendar-control-border bg-transparent px-5 py-[18px] text-base leading-[1.5] tracking-tight text-text-01 transition-colors placeholder:text-[15px] placeholder:font-light placeholder:text-text-04 focus:border-action-secondary-text focus:bg-white/80 focus:outline-none",
            description.length > 0 ? "min-h-[153px]" : "min-h-[174px]",
          )}
        />
        <span className="pointer-events-none absolute bottom-[18px] right-5 text-[13px] text-text-04">
          {description.length} / {MAX_DESCRIPTION_LENGTH}
        </span>
      </div>
    </section>
  );
}
