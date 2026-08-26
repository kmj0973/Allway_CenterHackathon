import { useEffect, useMemo, useState } from "react";

import type { SupportedLocale } from "@/types/preferences.type";
import { cn } from "@/utils/cn";
import {
  formatAppointmentTime,
  formatTimeZoneName,
  formatZonedDate,
  getCityTimeZoneOptions,
  getTimeZoneCity,
} from "@/utils/dateTime";

interface RegionStepProps {
  locale: SupportedLocale;
  timeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
}

// 1분마다 갱신하면 충분하다
const CLOCK_TICK_MS = 60 * 1000;

// 매 렌더마다 새로 만들면 옵션 목록이 계속 재계산되므로 모듈 스코프에 한 번만 둔다
const TIME_ZONE_OPTIONS = getCityTimeZoneOptions();

function RegionStep({ locale, timeZone, onTimeZoneChange }: RegionStepProps) {
  const [now, setNow] = useState(() => new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const info = useMemo(() => {
    const context = { locale, timeZone };

    return {
      name: formatTimeZoneName(now, context),
      city: getTimeZoneCity(timeZone),
      time: formatAppointmentTime(now, context),
      today: formatZonedDate(now, context),
    };
  }, [locale, timeZone, now]);

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return TIME_ZONE_OPTIONS;

    return TIME_ZONE_OPTIONS.filter(
      (option) =>
        option.city.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [query]);

  const selectTimeZone = (value: string) => {
    onTimeZoneChange(value);
    setIsPickerOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-81.25">
      <button
        type="button"
        onClick={() => setIsPickerOpen((open) => !open)}
        aria-expanded={isPickerOpen}
        className="flex h-17.5 w-full items-center justify-between rounded-3xl bg-white/70 px-4 py-3"
      >
        <div className="text-left">
          <p className="text-onboarding-card-title text-[1.125rem] leading-[1.4] font-semibold">
            {info.name}
          </p>
          <p className="text-onboarding-card-sub text-[0.8125rem] leading-[1.4]">
            {info.city}
          </p>
        </div>

        <div className="text-right">
          <p className="text-onboarding-card-title text-[1.125rem] leading-[1.4] font-semibold">
            {info.time}
          </p>
          <p className="text-onboarding-card-sub text-[0.8125rem] leading-[1.4]">
            {info.today}
          </p>
        </div>
      </button>

      {isPickerOpen && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-10 max-h-70 overflow-hidden rounded-3xl bg-white/95 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={info.city}
            className="text-onboarding-card-title w-full border-b border-black/10 px-4 py-3 text-[0.9375rem] outline-none"
          />

          <ul className="max-h-56 overflow-y-auto">
            {filteredOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => selectTimeZone(option.value)}
                  className={cn(
                    "text-onboarding-card-title flex w-full items-center justify-between px-4 py-2.5 text-left text-[0.875rem]",
                    "hover:bg-black/5",
                    option.value === timeZone && "bg-black/5 font-semibold",
                  )}
                >
                  <span>{option.city}</span>
                  <span className="text-onboarding-card-sub text-[0.75rem]">
                    {option.offsetLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default RegionStep;
