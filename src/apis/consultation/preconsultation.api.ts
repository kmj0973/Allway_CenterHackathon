import type { ApiResponse } from "@/types/api.type";
import type { PreconsultSubmissionResponse } from "@/types/consultation.type";

import axiosInstance from "../axiosInstance";

export async function getPreconsultSubmission(appointmentId: number) {
  const { data } = await axiosInstance.get<
    ApiResponse<PreconsultSubmissionResponse>
  >("/api/preconsult-submissions", {
    params: { appointmentId },
  });

  return data.data;
}

export async function getPreconsultSubmissionFile(fileUrl: string) {
  if (!fileUrl.startsWith("/api/preconsult-submissions/files/")) {
    throw new Error("Invalid preconsult submission file URL");
  }

  const { data } = await axiosInstance.get<Blob>(fileUrl, {
    responseType: "blob",
  });

  return data;
}
