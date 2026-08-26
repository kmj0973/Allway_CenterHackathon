import type { ApiResponse } from "@/types/api.type";
import type {
  AftercareDashboardResponse,
  AftercareHomeResponse,
  EmergencyMedicalReportResponse,
} from "@/types/aftercare.type";

import axiosInstance from "./axiosInstance";

/* 홈 화면 대시보드 요약. consultationAppointment는 예약이 없으면 null이다. */
export async function getAftercareHome() {
  const { data } = await axiosInstance.get<ApiResponse<AftercareHomeResponse>>(
    "/api/aftercare/home",
  );

  return data.data;
}

/* 사후관리 상세 화면. 각 회복 단계의 status(PAST/CURRENT/UPCOMING)는 서버가 판단해 내려준다. */
export async function getAftercareDashboard() {
  const { data } = await axiosInstance.get<
    ApiResponse<AftercareDashboardResponse>
  >("/api/aftercare/dashboard");

  return data.data;
}

/*
  글로벌 응급 의료 리포트. materials와 medicationAndAllergies.medications는
  줄바꿈으로 구분된 문자열로 내려온다.
*/
export async function getEmergencyMedicalReport() {
  const { data } = await axiosInstance.get<
    ApiResponse<EmergencyMedicalReportResponse>
  >("/api/aftercare/emergency-medical-report");

  return data.data;
}
