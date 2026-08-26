import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createConsultationSummary } from "@/apis/consultation/summary.api";
import type { CreateConsultationSummaryRequest } from "@/types/consultation.type";
import { consultationSummaryQueryKey } from "@/pages/consultation-summary/utils/consultationSummary";

interface CreateSummaryVariables {
  appointmentId: number;
  request: CreateConsultationSummaryRequest;
}

export function useCreateConsultationSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, request }: CreateSummaryVariables) =>
      createConsultationSummary(appointmentId, request),
    onSuccess: (summary, { request }) => {
      queryClient.setQueryData(
        consultationSummaryQueryKey(summary.summaryId, request.language),
        summary,
      );
    },
  });
}
