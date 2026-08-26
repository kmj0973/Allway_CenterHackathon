import type { SupportedLocale } from "@/types/preferences.type";
import { toDayKey } from "@/utils/aftercare";
import { cn } from "@/utils/cn";
import { formatWeekday } from "@/utils/dateTime";

interface WeekStripProps {
  days: Date[];
  today: Date;
  locale: SupportedLocale;
}

/*
시안의 방사형 그라데이션을 옮긴 값. 타원 크기는 칩(44x48)보다 가로로 넓다.
지난 날짜는 같은 그라데이션을 12%로 깐다. 투명도를 요소 전체(opacity)에 걸면
숫자까지 흐려지므로 색상에 직접 넣는다.
*/
function chipGradient(alpha: number): string {
  return `radial-gradient(ellipse 31px 24px at 50% 50%, rgba(65,60,85,${alpha}) 0%, rgba(88,81,124,${alpha}) 50%, rgba(110,101,162,${alpha}) 100%)`;
}

function WeekStrip({ days, today, locale }: WeekStripProps) {
  const todayKey = toDayKey(today);

  return (
    <ul className="flex items-center justify-around gap-1.75 px-5">
      {days.map((day) => {
        const key = toDayKey(day);
        const isToday = key === todayKey;
        // 지난 날짜와 오늘은 진하게, 앞으로 다가올 날짜만 흐리게 표시한다
        const isFuture = key > todayKey;

        return (
          <li key={key} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "text-caption leading-[1.25] font-medium tracking-[-0.025em]",
                isFuture ? "text-week-past" : "text-week-upcoming",
              )}
            >
              {formatWeekday(day, locale)}
            </span>

            <span
              style={
                !isFuture
                  ? { backgroundImage: chipGradient(isToday ? 1 : 0.12) }
                  : undefined
              }
              className={cn(
                "text-body flex h-12 w-11 items-center justify-center rounded-[20px] font-semibold",
                isToday
                  ? "text-neutral-white"
                  : isFuture
                    ? "text-week-past"
                    : "text-week-upcoming",
              )}
            >
              {day.getDate()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default WeekStrip;
