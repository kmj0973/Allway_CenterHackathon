import { useQuery } from "@tanstack/react-query";

import { getAvailableConsultationDates } from "@/apis/consultation/appointment.api";

export const availableConsultationDatesQueryKey = (
  year: number,
  month: number,
) => ["consultation-available-dates", year, month] as const;

export function useAvailableConsultationDates(year: number, month: number) {
  return useQuery({
    queryKey: availableConsultationDatesQueryKey(year, month),
    queryFn: () => getAvailableConsultationDates(year, month),
    enabled: year >= 2000 && year <= 2100 && month >= 1 && month <= 12,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
