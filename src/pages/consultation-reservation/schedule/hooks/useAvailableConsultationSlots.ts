import { useQuery } from "@tanstack/react-query";

import { getAvailableConsultationSlots } from "@/apis/consultation/appointment.api";
import type { LocalDateString } from "@/types/consultationReservation.type";

export const availableConsultationSlotsQueryKey = (
  date: LocalDateString | null,
) => ["consultation-available-slots", date] as const;

export function useAvailableConsultationSlots(date: LocalDateString | null) {
  return useQuery({
    queryKey: availableConsultationSlotsQueryKey(date),
    queryFn: () => getAvailableConsultationSlots(date as LocalDateString),
    enabled: date !== null,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
