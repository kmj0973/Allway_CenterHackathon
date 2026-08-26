import { cva, type VariantProps } from "class-variance-authority";
import { useId, type SelectHTMLAttributes } from "react";

import chevronDown from "@/assets/common/chevron-down.svg";
import { cn } from "@/utils/cn";

const selectVariants = cva(
  [
    "appearance-none border text-sm text-[#1F2937]",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default:
          "h-9.5 w-full rounded border-[#D1D5DB] bg-white py-2 pr-8 pl-3",
        chip: "rounded-full border-[#E5E7EB] bg-[#F3F4F6] py-1.5 pr-8 pl-3",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
);

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">,
    VariantProps<typeof selectVariants> {
  label?: string;
  options: readonly SelectOption[];
  placeholder?: string;
}

export default function Select({
  label,
  options,
  placeholder = "Select…",
  variant,
  className,
  id,
  value,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const isChip = variant === "chip";

  return (
    <div className={cn("flex flex-col gap-1.5", !isChip && "w-full")}>
      {label && (
        <label htmlFor={selectId} className="text-sm text-[#1F2937]">
          {label}
        </label>
      )}

      <div className={cn("relative", !isChip && "w-full")}>
        <select
          id={selectId}
          value={value ?? ""}
          className={cn(
            selectVariants({ variant }),
            !value && "text-[#9CA3AF]",
            className,
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <img
          src={chevronDown}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2"
        />
      </div>
    </div>
  );
}
