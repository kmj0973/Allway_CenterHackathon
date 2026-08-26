import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelConsultationAppointment } from "@/apis/consultation/appointment.api";
import type { CancelConsultationAppointmentRequest } from "@/types/consultationReservation.type";

export function useCancelConsultationAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CancelConsultationAppointmentRequest) =>
      cancelConsultationAppointment(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["active-consultation-appointment"] });
      void queryClient.invalidateQueries({ queryKey: ["consultation-history"] });
      void queryClient.invalidateQueries({ queryKey: ["consultation-available-dates"] });
      void queryClient.invalidateQueries({ queryKey: ["consultation-available-slots"] });
    },
  });
}
