import type { ApiResponse } from "@/types/api.type";
import type {
  ActiveConsultationAppointment,
  AvailableConsultationDate,
  CancelConsultationAppointmentRequest,
  ConsultationAppointmentDetail,
  ConsultationDailySlots,
  CreateConsultationAppointmentRequest,
  CreateConsultationAppointmentResponse,
  LocalDateString,
} from "@/types/consultationReservation.type";

import axiosInstance from "../axiosInstance";

export async function cancelConsultationAppointment({
  appointmentId,
}: CancelConsultationAppointmentRequest) {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(
    `/api/appointments/${appointmentId}`,
    {
      data: {
        cancelReason: "OTHER",
      },
    },
  );

  return data;
}

export async function getActiveConsultationAppointment(caseId: number) {
  const { data } = await axiosInstance.get<
    ApiResponse<ActiveConsultationAppointment[]>
  >("/api/appointments", {
    params: { caseId },
  });

  return data.data;
}

export async function getConsultationAppointmentDetail(appointmentId: number) {
  const { data } = await axiosInstance.get<
    ApiResponse<ConsultationAppointmentDetail>
  >(`/api/appointments/${appointmentId}`);

  return data.data;
}

export async function getAvailableConsultationDates(
  year: number,
  month: number,
) {
  const { data } = await axiosInstance.get<
    ApiResponse<AvailableConsultationDate[]>
  >("/api/appointments/available-dates", {
    params: { year, month },
  });

  return data.data;
}

export async function getAvailableConsultationSlots(date: LocalDateString) {
  const { data } = await axiosInstance.get<ApiResponse<ConsultationDailySlots>>(
    "/api/appointments/available-slots",
    { params: { date } },
  );

  return data.data;
}

export async function createConsultationAppointment({
  caseId,
  slotId,
  symptomCategory,
  symptomCategories = [],
  symptomNote,
  files = [],
}: CreateConsultationAppointmentRequest) {
  const formData = new FormData();
  formData.append("caseId", String(caseId));
  formData.append("slotId", String(slotId));

  if (symptomCategory) formData.append("symptomCategory", symptomCategory);
  symptomCategories.forEach((category) =>
    formData.append("symptomCategories", category),
  );
  if (symptomNote?.trim()) formData.append("symptomNote", symptomNote.trim());
  files.forEach((file) => formData.append("files", file));

  const { data } = await axiosInstance.post<
    ApiResponse<CreateConsultationAppointmentResponse>
  >("/api/appointments", formData);

  return data.data;
}
