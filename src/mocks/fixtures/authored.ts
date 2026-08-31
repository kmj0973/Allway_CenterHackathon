import type {
  ChatRoomDetailResponse,
  PostSymptomMessageRequest,
} from "@/types/aiChat.type";
import type {
  ActiveConsultationAppointment,
  AvailableConsultationDate,
  ConsultationAppointmentDetail,
  CreateConsultationAppointmentResponse,
} from "@/types/consultationReservation.type";
import type {
  EndConsultationResponse,
  JoinConsultationResponse,
  PreconsultSubmissionResponse,
  RenewRtcTokenResponse,
  SaveCaptionBatchResponse,
  StartSttAgentResponse,
  SttAgentStatusResponse,
} from "@/types/consultation.type";
import type {
  UpdatePatientSettingsResponse,
  VerifyAccessLinkResponse,
} from "@/types/patient.type";

/*
  ⚠️ 이 파일의 값은 실제 서버 응답이 아닙니다.

  백엔드 종료 후 src/types 정의를 근거로 작성한 예시 데이터입니다.
  형태(shape)는 타입과 일치하지만 값은 시연용입니다.
  실제 캡처본은 fixtures/captured.json 에 있습니다.
*/

/* 시연 기준 시각. 예약·상담 시각을 이 시점 기준으로 계산한다. */
const BASE_DATE = new Date("2026-09-02T05:00:00Z");
const CASE_ID = 2;
const APPOINTMENT_ID = 101;
const SESSION_ID = 501;

const iso = (offsetMinutes: number) =>
  new Date(BASE_DATE.getTime() + offsetMinutes * 60_000).toISOString();

const offsetIso = (offsetMinutes: number) =>
  iso(offsetMinutes).replace("Z", "+00:00");

// ── 환자 ────────────────────────────────────────────────

export const verifyAccessLink: VerifyAccessLinkResponse = {
  patientId: 2,
  accessToken: "mock.access.token",
};

export const updatePatientSettings: UpdatePatientSettingsResponse = {
  patientId: 2,
  language: "한국어",
  accessToken: "mock.access.token",
};

// ── 예약 ────────────────────────────────────────────────

/*
  캡처 당시 진행 중 예약이 없어 빈 배열이었다.
  시연에서는 예약이 있는 상태가 자연스러우므로 한 건을 채운다.
*/
export const activeAppointments: ActiveConsultationAppointment[] = [
  {
    appointmentId: APPOINTMENT_ID,
    caseId: CASE_ID,
    slotId: 3001,
    startsAt: offsetIso(0),
    endsAt: offsetIso(20),
    symptomCategory: "SWELLING",
    symptomCategories: ["SWELLING", "PAIN"],
    symptomNote: "눈 주변 부기가 어제보다 심해졌습니다.",
    waitingRoomOpensAt: offsetIso(-10),
    waitingRoomClosesAt: offsetIso(20),
    canEnterWaitingRoom: true,
    timezoneId: "Asia/Seoul",
    status: "CONFIRMED",
  },
];

export const appointmentDetail: ConsultationAppointmentDetail = {
  appointmentId: APPOINTMENT_ID,
  startsAt: offsetIso(0),
  endsAt: offsetIso(20),
  symptomCategories: ["SWELLING", "PAIN"],
  symptomNote: "눈 주변 부기가 어제보다 심해졌습니다.",
};

/* 캡처본이 빈 배열이었으므로 이번 달 예약 가능일을 채운다. */
export const availableDates: AvailableConsultationDate[] = [
  { date: "2026-09-02", availableCount: 4 },
  { date: "2026-09-03", availableCount: 2 },
  { date: "2026-09-05", availableCount: 6 },
  { date: "2026-09-08", availableCount: 1 },
];

export const createdAppointment: CreateConsultationAppointmentResponse = {
  appointmentId: APPOINTMENT_ID,
  caseId: CASE_ID,
  slotId: 3001,
  startsAt: offsetIso(0),
  endsAt: offsetIso(20),
  waitingRoomOpensAt: offsetIso(-10),
  waitingRoomClosesAt: offsetIso(20),
  canEnterWaitingRoom: true,
  timezoneId: "Asia/Seoul",
  status: "CONFIRMED",
};

export const preconsultSubmission: PreconsultSubmissionResponse = {
  submissionId: 77,
  appointmentId: APPOINTMENT_ID,
  symptomCategory: "SWELLING",
  symptomCategories: ["SWELLING", "PAIN"],
  symptomNote: "눈 주변 부기가 어제보다 심해졌습니다.",
  files: [],
};

// ── 화상 상담 ────────────────────────────────────────────

/*
  실제 Agora 연결은 시연에 필요하지 않다.
  화면이 검증하는 것은 연결 상태 관리와 오류 분기이므로,
  형태가 맞는 응답만 있으면 전체 흐름을 재현할 수 있다.
*/
export const joinConsultation: JoinConsultationResponse = {
  appointmentId: APPOINTMENT_ID,
  sessionId: SESSION_ID,
  agoraAppId: "mock-agora-app-id",
  rtcChannelName: `consultation-${APPOINTMENT_ID}`,
  agoraUid: 20001,
  rtcToken: "mock-rtc-token",
  tokenExpiresAt: iso(60),
  role: "환자",
  userLanguage: "ko-KR",
  peerLanguage: "en-US",
  sttPublisherAgoraUid: 90001,
  recommendedDurationSeconds: 1200,
  forceEndAt: iso(30),
};

export const startSttAgent: StartSttAgentResponse = {
  sessionId: SESSION_ID,
  agentId: "mock-stt-agent",
  status: "STARTING",
};

export const sttAgentStatus: SttAgentStatusResponse = {
  sessionId: SESSION_ID,
  agentId: "mock-stt-agent",
  status: "RUNNING",
};

export const renewRtcToken: RenewRtcTokenResponse = {
  rtcToken: "mock-rtc-token-renewed",
  tokenExpiresAt: iso(120),
};

export const saveCaptionBatch: SaveCaptionBatchResponse = {
  receivedCount: 2,
  insertedCount: 2,
  updatedCount: 0,
};

export const endConsultation: EndConsultationResponse = {
  sessionId: SESSION_ID,
  status: "COMPLETED",
  startedAt: iso(0),
  endedAt: iso(14),
  actualDurationSeconds: 842,
};

// ── AI 채팅 ─────────────────────────────────────────────

/*
  새 질문을 보내면 방 전체를 다시 내려주는 형태다.
  핸들러에서 사용자의 질문을 이어 붙여 대화가 이어지는 것처럼 보이게 한다.
*/
export function buildChatReply(
  request: Pick<PostSymptomMessageRequest, "roomId" | "question">,
  hasImage: boolean,
): ChatRoomDetailResponse {
  const now = new Date().toISOString();

  return {
    roomId: request.roomId ?? 99,
    roomTitle: request.question.slice(0, 20) || "새 상담",
    messages: [
      {
        messageId: Date.now(),
        role: "USER",
        content: request.question,
        imageUrl: hasImage ? "/mock/symptom-photo.png" : null,
        sentAt: now,
      },
      {
        messageId: Date.now() + 1,
        role: "ASSISTANT",
        content:
          "말씀하신 증상은 시술 후 회복 과정에서 흔히 나타날 수 있습니다. " +
          "냉찜질을 하루 3회, 회당 15분 정도 시행해 보시고 " +
          "부기가 이틀 이상 심해지거나 열감이 동반되면 담당 의료진과 상담하세요.\n\n" +
          "이 안내는 참고 자료이며 의료진의 진단을 대신하지 않습니다.",
        imageUrl: null,
        sentAt: now,
      },
    ],
  };
}
