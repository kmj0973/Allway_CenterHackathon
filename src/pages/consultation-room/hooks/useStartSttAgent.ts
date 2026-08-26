import { startSttAgent } from "@/apis/consultation/room.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sttAgentStatusQueryKey } from "./useSttAgentStatus";

export function useStartSttAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: number) => startSttAgent(appointmentId),
    onSuccess: (data, appointmentId) => {
      queryClient.setQueryData(sttAgentStatusQueryKey(appointmentId), data);
    },
  });
}
