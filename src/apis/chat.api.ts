import type { ApiResponse } from "@/types/api.type";
import type {
  ChatRoomDetailResponse,
  ChatRoomSummary,
  PostSymptomMessageRequest,
} from "@/types/aiChat.type";

import axiosInstance from "./axiosInstance";

/* 최근 대화순으로 정렬된 채팅방 목록. 채팅방이 없으면 빈 배열이 내려온다. */
export async function getChatRooms() {
  const { data } = await axiosInstance.get<ApiResponse<ChatRoomSummary[]>>(
    "/api/ai-chats/rooms",
  );

  return data.data;
}

/* 특정 채팅방의 전체 대화 내역. 오래된 메시지 순으로 정렬돼 내려온다. */
export async function getChatRoomMessages(roomId: number) {
  const { data } = await axiosInstance.get<ApiResponse<ChatRoomDetailResponse>>(
    `/api/ai-chats/rooms/${roomId}/messages`,
  );

  return data.data;
}

/*
  AI 챗봇에 증상을 문의한다. multipart/form-data로 전송해야 해서
  axiosInstance 기본 Content-Type(application/json)을 이 요청만 무효화한다.
  roomId를 안 보내면 서버가 새 채팅방을 만든다.
*/
export async function postSymptomMessage({
  roomId,
  question,
  image,
}: PostSymptomMessageRequest) {
  const formData = new FormData();
  if (roomId !== undefined) formData.append("roomId", String(roomId));
  formData.append("question", question);
  if (image) formData.append("image", image);

  const { data } = await axiosInstance.post<
    ApiResponse<ChatRoomDetailResponse>
  >("/api/ai-chats/messages", formData, {
    headers: { "Content-Type": undefined },
  });

  return data.data;
}

/** Bearer 인증이 필요한 채팅 첨부 이미지를 Blob으로 가져온다. */
export async function getChatImage(imageUrl: string) {
  const { data } = await axiosInstance.get<Blob>(imageUrl, {
    responseType: "blob",
  });

  return data;
}
