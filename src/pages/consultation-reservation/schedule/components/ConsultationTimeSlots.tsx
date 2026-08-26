import { useTranslation } from "react-i18next";

import type { ConsultationReservationSlot } from "@/types/consultationReservation.type";
import type { SupportedLocale } from "@/types/preferences.type";
import { cn } from "@/utils/cn";
import { formatAppointmentTime, formatTimeZoneOffset } from "@/utils/dateTime";
import type { ConsultationSlotGroup } from "@/utils/groupConsultationSlots";

const KOREA_TIME_ZONE = "Asia/Seoul";

interface ConsultationTimeSlotsProps {
  locale: SupportedLocale;
  userTimeZone: string;
  groups: ConsultationSlotGroup[];
  selectedSlotId?: number;
  onSelect: (slot: ConsultationReservationSlot) => void;
}

function ConsultationTimeSlots({
  locale,
  userTimeZone,
  groups,
  selectedSlotId,
  onSelect,
}: ConsultationTimeSlotsProps) {
  const { t } = useTranslation("consultationReservation");

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <header>
            <h2 className="text-calendar-text text-lg font-semibold tracking-tight">
              {formatAppointmentTime(group.startsAt, {
                locale,
                timeZone: userTimeZone,
              })}
            </h2>
            <p className="mt-1 text-sm tracking-tight text-action-secondary-text">
              {t("schedule.localTime", {
                time: formatAppointmentTime(group.startsAt, {
                  locale,
                  timeZone: KOREA_TIME_ZONE,
                }),
                offset: formatTimeZoneOffset(group.startsAt, {
                  locale,
                  timeZone: KOREA_TIME_ZONE,
                }).replace("GMT", "UTC"),
              })}
            </p>
          </header>

          <div className="grid grid-cols-4 gap-2">
            {group.slots.map((slot) => {
              const isSelected = selectedSlotId === slot.slotId;

              return (
                <button
                  key={slot.slotId}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={!slot.available}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center rounded-[30px] border text-base tracking-tight transition-colors",
                    !slot.available
                      ? "cursor-not-allowed border-transparent bg-action-disabled text-[#9795A0]"
                      : isSelected
                        ? "border-action-secondary-text bg-action-secondary-text font-medium text-action-primary-text"
                        : "border-calendar-control-border bg-transparent font-normal text-calendar-text",
                  )}
                >
                  <span>
                    {formatAppointmentTime(
                      slot.startsAt,
                      {
                        locale,
                        timeZone: userTimeZone,
                      },
                      "h23",
                    )}
                  </span>
                  {!slot.available && (
                    <span className="text-[10px] leading-none">
                      {t("schedule.closed")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ConsultationTimeSlots;
