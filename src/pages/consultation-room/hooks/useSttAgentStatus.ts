import { getSttAgentStatus } from "@/apis/consultation/room.api";
import { useQuery } from "@tanstack/react-query";

export const sttAgentStatusQueryKey = (appointmentId: number) =>
  ["consultation", appointmentId, "stt", "status"] as const;

export function useSttAgentStatus(
  appointmentId: number | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: sttAgentStatusQueryKey(appointmentId ?? 0),
    queryFn: () => getSttAgentStatus(appointmentId!),
    enabled: enabled && appointmentId !== undefined,
    retry: false,
    staleTime: 0,
  });
}
