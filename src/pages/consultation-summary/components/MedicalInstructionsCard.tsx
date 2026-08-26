import instructionIcon1 from "@/assets/icons/consultation-summary/1.svg";
import instructionIcon2 from "@/assets/icons/consultation-summary/2.svg";
import instructionIcon3 from "@/assets/icons/consultation-summary/3.svg";
import instructionIcon4 from "@/assets/icons/consultation-summary/4.svg";
import instructionIcon5 from "@/assets/icons/consultation-summary/5.svg";
import instructionIcon6 from "@/assets/icons/consultation-summary/6.svg";
import instructionIcon7 from "@/assets/icons/consultation-summary/7.svg";

import type { SummaryInstruction } from "@/types/consultation.type";

interface MedicalInstructionsCardProps {
  instructions: SummaryInstruction[];
  title: string;
}

const instructionIcons: Record<NonNullable<SummaryInstruction["icon"]>, string> = {
  1: instructionIcon1,
  2: instructionIcon2,
  3: instructionIcon3,
  4: instructionIcon4,
  5: instructionIcon5,
  6: instructionIcon6,
  7: instructionIcon7,
};

export default function MedicalInstructionsCard({
  instructions,
  title,
}: MedicalInstructionsCardProps) {
  return (
    <section aria-labelledby="instructions-heading" className="mt-10">
      <h2
        id="instructions-heading"
        className="text-[22px] font-semibold leading-[1.4] tracking-[-0.55px] text-[#32303A]"
      >
        {title}
      </h2>
      <ul className="mt-[14px] flex snap-x gap-[10px] overflow-x-auto px-5 pb-1">
        {instructions.map((instruction) => (
          <li
            key={instruction.instructionId}
            className="flex h-[227px] w-[171px] shrink-0 snap-start flex-col rounded-[28px] bg-white px-5 py-6 shadow-[0_4px_4px_rgba(0,0,0,0.03)]"
          >
            <div className="flex h-[95px] items-center justify-center">
              <img
                src={instructionIcons[instruction.icon ?? 1] ?? instructionIcon1}
                alt=""
                className="size-[42px]"
              />
            </div>

            <div className="mt-2 flex w-full flex-col gap-3">
              <h3 className="line-clamp-1 text-base font-bold leading-[1.4] tracking-[-0.4px] text-[#4B4B4E]">
                {instruction.title}
              </h3>
              <p className="line-clamp-2 text-sm leading-[1.5] tracking-[-0.35px] text-[#65646D]">
                {instruction.content}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
