import { useQuery } from "@tanstack/react-query";

import {
  getPreconsultSubmission,
  getPreconsultSubmissionFile,
} from "@/apis/consultation/preconsultation.api";

export function usePreconsultSubmission(appointmentId: number) {
  return useQuery({
    queryKey: ["preconsult-submission", appointmentId],
    queryFn: () => getPreconsultSubmission(appointmentId),
    enabled: Number.isInteger(appointmentId) && appointmentId > 0,
    retry: false,
    staleTime: 30_000,
  });
}

export function usePreconsultSubmissionFile(fileUrl: string) {
  return useQuery({
    queryKey: ["preconsult-submission-file", fileUrl],
    queryFn: () => getPreconsultSubmissionFile(fileUrl),
    enabled: Boolean(fileUrl),
    staleTime: 5 * 60_000,
  });
}
