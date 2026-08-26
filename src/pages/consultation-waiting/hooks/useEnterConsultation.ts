import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { useJoinConsultation } from "./useMutation/useJoinConsultation";
import { useConsultationStore } from "@/stores/useConsultationStore";
import { getJoinErrorMessage } from "@/utils/getJoinErrorMessage";
import type { ApiErrorResponse } from "@/types/api.type";
import type { ParticipantRole } from "@/types/consultation.type";
import i18n from "@/i18n";

interface UseEnterConsultationParams {
  appointmentId?: string;
  role: ParticipantRole;
}

export function useEnterConsultation({
  appointmentId,
  role,
}: UseEnterConsultationParams) {
  const navigate = useNavigate();
  const setRoomInfo = useConsultationStore((state) => state.setRoomInfo);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: joinConsultation, isPending } = useJoinConsultation();

  const enterRoom = async () => {
    const parsedAppointmentId = Number(appointmentId);

    if (!appointmentId || !Number.isInteger(parsedAppointmentId)) {
      setErrorMessage(
        i18n.t("joinError.invalidAppointment", {
          ns: "consultationWaiting",
        }),
      );
      return;
    }

    setErrorMessage(null);

    try {
      const isMedicalStaff = role === "MEDICAL_STAFF";
      const roomInfo = await joinConsultation({
        appointmentId: parsedAppointmentId,
        role,
        agoraUid: isMedicalStaff ? 20001 : 10001,
        userLanguage: isMedicalStaff ? "ko-KR" : "en-US",
      });

      setRoomInfo(roomInfo);
      navigate(`/consultation/${parsedAppointmentId}/room?role=${role}`);
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getJoinErrorMessage(error.response?.data.code)
        : i18n.t("joinError.unknown", { ns: "consultationWaiting" });

      setErrorMessage(message);
    }
  };

  return {
    enterRoom,
    isEntering: isPending,
    enterErrorMessage: errorMessage,
  };
}
