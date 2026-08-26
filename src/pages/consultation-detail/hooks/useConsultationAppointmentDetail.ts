import { useQuery } from "@tanstack/react-query";

import { getConsultationAppointmentDetail } from "@/apis/consultation/appointment.api";

export const consultationAppointmentDetailQueryKey = (
  appointmentId: number,
) => ["consultation-appointment-detail", appointmentId] as const;

export function useConsultationAppointmentDetail(appointmentId: number) {
  return useQuery({
    queryKey: consultationAppointmentDetailQueryKey(appointmentId),
    queryFn: () => getConsultationAppointmentDetail(appointmentId),
    enabled: Number.isInteger(appointmentId) && appointmentId > 0,
    staleTime: 30_000,
  });
}
