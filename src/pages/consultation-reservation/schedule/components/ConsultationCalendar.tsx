import { DayPicker, getDefaultClassNames } from "@daypicker/react";
import { enUS, ja, ko, zhCN } from "@daypicker/react/locale";

import type { AvailableConsultationDate } from "@/types/consultationReservation.type";
import type { SupportedLocale } from "@/types/preferences.type";
import { cn } from "@/utils/cn";
import { parseCalendarDate } from "@/utils/dateTime";

interface ConsultationCalendarProps {
  locale: SupportedLocale;
  startMonth: Date;
  month: Date;
  selected?: Date;
  availableDates: AvailableConsultationDate[];
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date | undefined) => void;
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const dayPickerLocales = {
  "ko-KR": ko,
  "en-US": enUS,
  "ja-JP": ja,
  "zh-CN": zhCN,
};

export default function ConsultationCalendar({
  locale,
  startMonth,
  month,
  selected,
  availableDates,
  onMonthChange,
  onSelect,
}: ConsultationCalendarProps) {
  const defaultClassNames = getDefaultClassNames();
  const selectableDates = availableDates
    .filter(({ availableCount }) => availableCount > 0)
    .map(({ date }) => parseCalendarDate(date));

  const isUnavailableDate = (date: Date) =>
    !selectableDates.some((selectableDate) => isSameDate(date, selectableDate));

  return (
    <DayPicker
      mode="single"
      locale={dayPickerLocales[locale]}
      weekStartsOn={0}
      startMonth={startMonth}
      month={month}
      selected={selected}
      onMonthChange={onMonthChange}
      onSelect={onSelect}
      disabled={isUnavailableDate}
      showOutsideDays
      fixedWeeks
      classNames={{
        root: "relative w-full",
        months: "w-full",
        month: "w-full",
        month_caption: "flex h-7 items-center justify-center px-12",
        caption_label:
          "text-calendar-text max-w-[calc(100%-96px)] truncate text-center text-xl font-semibold tracking-tight",
        nav: [
          "absolute left-1/2 top-0 z-10",
          "flex h-7 w-[230px]",
          "-translate-x-1/2 items-center justify-between",
        ].join(" "),
        button_previous: [
          defaultClassNames.button_previous,
          "flex size-6 items-center justify-center rounded-full text-calendar-text",
          "aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:text-calendar-text/30 aria-disabled:opacity-100",
        ].join(" "),
        button_next: [
          defaultClassNames.button_next,
          "flex size-6 items-center justify-center rounded-full text-calendar-text",
          "aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:text-calendar-text/30 aria-disabled:opacity-100",
        ].join(" "),
        chevron: [defaultClassNames.chevron, "size-6 fill-current"].join(" "),
        month_grid: cn(
          "mt-[34px] h-[408px] w-full table-fixed border-separate border-spacing-0 rounded-[24px] p-2",
          selected ? "bg-white/80" : "bg-white/[0.64]",
        ),
        weekdays: "flex w-full",
        weekday:
          "text-calendar-text flex h-14 w-[14.285714%] items-center justify-center text-base font-light tracking-tight first:text-calendar-sunday last:text-[#347BF7]",
        week: "flex w-full",
        day: "text-calendar-text flex h-14 w-[14.285714%] items-center justify-center text-base tracking-tight",
        day_button:
          "flex h-14 w-[50px] items-center justify-center rounded-[20px] bg-transparent font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset",
        selected:
          "[&>button]:bg-[radial-gradient(ellipse_70.48%_50%_at_center,#574595_0%,#7962D5_100%)] [&>button]:font-semibold [&>button]:text-[#FDFDFF]",
        disabled: "text-calendar-text pointer-events-none opacity-30",
        outside: "opacity-30",
      }}
      formatters={{
        formatCaption: (date) =>
          new Intl.DateTimeFormat(locale, {
            year: "numeric",
            month: "long",
          }).format(date),
        formatWeekdayName: (date) =>
          new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(date),
      }}
    />
  );
}
