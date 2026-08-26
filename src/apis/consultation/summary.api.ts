import type { ApiResponse } from "@/types/api.type";
import type {
  ConsultationSummaryListItem,
  ConsultationSummaryResponse,
  CreateConsultationSummaryRequest,
  SummaryRequestLanguage,
} from "@/types/consultation.type";

import axiosInstance from "../axiosInstance";

export async function createConsultationSummary(
  appointmentId: number,
  body: CreateConsultationSummaryRequest,
) {
  const { data } = await axiosInstance.post<
    ApiResponse<ConsultationSummaryResponse>
  >(`/api/consultation-summaries/${appointmentId}`, body);

  return data.data;
}

export async function getConsultationSummaries(
  language: SummaryRequestLanguage,
) {
  const { data } = await axiosInstance.get<
    ApiResponse<ConsultationSummaryListItem[]>
  >("/api/consultation-summaries", {
    params: { language },
  });

  return data.data;
}

export async function getConsultationSummary(
  summaryId: number,
  language: SummaryRequestLanguage,
) {
  const { data } = await axiosInstance.get<
    ApiResponse<ConsultationSummaryResponse>
  >(`/api/consultation-summaries/${summaryId}`, {
    params: { language },
  });

  return data.data;
}
