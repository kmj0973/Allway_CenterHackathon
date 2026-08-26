import { useMutation } from "@tanstack/react-query";

import { endConsultation } from "@/apis/consultation/room.api";

export function useEndConsultation() {
  return useMutation({
    mutationFn: (appointmentId: number) => endConsultation(appointmentId),
  });
}
