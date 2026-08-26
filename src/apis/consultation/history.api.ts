import type { ApiResponse } from "@/types/api.type";
import type { ConsultationHistoryItem } from "@/types/consultation.type";

import axiosInstance from "../axiosInstance";

export async function getConsultationHistory() {
  const { data } = await axiosInstance.get<
    ApiResponse<ConsultationHistoryItem[]>
  >("/api/consultations/history");

  return data.data;
}
