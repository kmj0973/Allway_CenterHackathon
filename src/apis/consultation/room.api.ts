import type { ApiResponse } from "@/types/api.type";
import type {
  EndConsultationResponse,
  JoinConsultationRequest,
  JoinConsultationResponse,
  RenewRtcTokenRequest,
  RenewRtcTokenResponse,
  SaveCaptionBatchRequest,
  SaveCaptionBatchResponse,
  StartSttAgentResponse,
  SttAgentStatusResponse,
} from "@/types/consultation.type";

import axiosInstance from "../axiosInstance";

export async function joinConsultation(
  appointmentId: number,
  body: JoinConsultationRequest,
) {
  const { data } = await axiosInstance.post<
    ApiResponse<JoinConsultationResponse>
  >(`/api/consultations/${appointmentId}/join`, body);

  return data.data;
}

export async function startSttAgent(appointmentId: number) {
  const { data } = await axiosInstance.post<ApiResponse<StartSttAgentResponse>>(
    `/api/consultations/${appointmentId}/transcription/start`,
  );

  return data.data;
}

export async function getSttAgentStatus(appointmentId: number) {
  const { data } = await axiosInstance.get<ApiResponse<SttAgentStatusResponse>>(
    `/api/consultations/${appointmentId}/transcription/status`,
  );

  return data.data;
}

export async function renewConsultationRtcToken(
  appointmentId: number,
  body: RenewRtcTokenRequest,
) {
  const { data } = await axiosInstance.post<ApiResponse<RenewRtcTokenResponse>>(
    `/api/consultations/${appointmentId}/token/renew`,
    body,
  );

  return data.data;
}

export async function saveConsultationCaptionBatch(
  appointmentId: number,
  body: SaveCaptionBatchRequest,
) {
  const { data } = await axiosInstance.post<
    ApiResponse<SaveCaptionBatchResponse>
  >(`/api/consultations/${appointmentId}/captions/batch`, body);

  return data.data;
}

export async function endConsultation(appointmentId: number) {
  const { data } = await axiosInstance.post<
    ApiResponse<EndConsultationResponse>
  >(`/api/consultations/${appointmentId}/end`);

  return data.data;
}
