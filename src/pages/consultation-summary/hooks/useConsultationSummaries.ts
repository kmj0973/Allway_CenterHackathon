import { useQuery } from "@tanstack/react-query";

import { getConsultationSummaries } from "@/apis/consultation/summary.api";
import type { SummaryRequestLanguage } from "@/types/consultation.type";
import { consultationSummaryListQueryKey } from "../utils/consultationSummary";

export function useConsultationSummaries(language: SummaryRequestLanguage) {
  return useQuery({
    queryKey: consultationSummaryListQueryKey(language),
    queryFn: () => getConsultationSummaries(language),
    staleTime: 30_000,
  });
}
