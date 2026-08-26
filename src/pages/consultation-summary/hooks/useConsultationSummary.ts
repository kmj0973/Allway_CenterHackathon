import { useQuery } from "@tanstack/react-query";

import { getConsultationSummary } from "@/apis/consultation/summary.api";
import type { SummaryRequestLanguage } from "@/types/consultation.type";
import { consultationSummaryQueryKey } from "../utils/consultationSummary";

export function useConsultationSummary(
  summaryId: number,
  language: SummaryRequestLanguage,
) {
  return useQuery({
    queryKey: consultationSummaryQueryKey(summaryId, language),
    queryFn: () => getConsultationSummary(summaryId, language),
    enabled: Number.isInteger(summaryId) && summaryId > 0,
    staleTime: 30_000,
  });
}
