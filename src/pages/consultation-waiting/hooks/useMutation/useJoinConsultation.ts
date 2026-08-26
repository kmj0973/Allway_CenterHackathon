import { joinConsultation } from "@/apis/consultation/room.api";
import { useMutation } from "@tanstack/react-query";

export const useJoinConsultation = () => {
  return useMutation({
    mutationFn: ({
      appointmentId,
      role,
      agoraUid,
      userLanguage,
    }: {
      appointmentId: number;
      role: "PATIENT" | "MEDICAL_STAFF";
      agoraUid: number;
      userLanguage: string;
    }) =>
      joinConsultation(appointmentId, {
        role,
        agoraUid,
        userLanguage,
      }),
  });
};
