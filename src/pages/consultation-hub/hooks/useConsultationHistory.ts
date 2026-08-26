import { useQuery } from "@tanstack/react-query";

import { getConsultationHistory } from "@/apis/consultation/history.api";

export const consultationHistoryQueryKey = ["consultation-history"] as const;

export function useConsultationHistory() {
  return useQuery({
    queryKey: consultationHistoryQueryKey,
    queryFn: getConsultationHistory,
    staleTime: 30_000,
  });
}
