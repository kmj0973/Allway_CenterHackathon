import { http, HttpResponse } from "msw";

import * as authored from "../fixtures/authored";
import { capturedBody } from "../fixtures";

/*
  API 서버 없이 전체 플로우를 실행하기 위한 목 핸들러.

  응답 출처는 두 가지다.
    passthroughCaptured() : 실제 서버에서 캡처한 응답을 그대로 반환
    ok()                  : 타입 정의를 근거로 작성한 예시 응답

  baseURL 설정과 무관하게 동작하도록 경로 패턴에 와일드카드를 사용한다.
*/

/* ApiResponse<T> 형태로 감싼다 */
function ok<T>(data: T, message = "호출에 성공하였습니다.") {
  return HttpResponse.json({
    isSuccess: true,
    timestamp: new Date().toISOString(),
    code: "GLOBAL_200",
    httpStatus: 200,
    message,
    data,
  });
}

/*
  핸들러가 참조하는 캡처 키 목록.
  browser.ts 가 시작 시점에 이 키들이 실제로 존재하는지 확인한다.
*/
export const USED_CAPTURED_KEYS = [
  "GET /api/aftercare/home",
  "GET /api/aftercare/dashboard",
  "GET /api/aftercare/emergency-medical-report",
  "GET /api/ai-chats/rooms",
  "GET /api/ai-chats/rooms/:id/messages",
  "GET /api/appointments/available-slots",
  "GET /api/consultations/history",
  "GET /api/consultation-summaries",
  "GET /api/consultation-summaries/:id",
] as const;

/* 캡처본은 응답 봉투까지 그대로 저장돼 있으므로 그대로 내보낸다 */
function captured(key: (typeof USED_CAPTURED_KEYS)[number]) {
  return HttpResponse.json(capturedBody(key));
}

export const handlers = [
  // ── 환자 ──────────────────────────────────────────────
  http.post("*/api/patients/access-links/verify", () =>
    ok(authored.verifyAccessLink),
  ),
  http.patch("*/api/patients/me/settings", () =>
    ok(authored.updatePatientSettings),
  ),

  // ── 사후관리 (전부 실제 캡처본) ────────────────────────
  http.get("*/api/aftercare/home", () => captured("GET /api/aftercare/home")),
  http.get("*/api/aftercare/dashboard", () =>
    captured("GET /api/aftercare/dashboard"),
  ),
  http.get("*/api/aftercare/emergency-medical-report", () =>
    captured("GET /api/aftercare/emergency-medical-report"),
  ),

  // ── AI 채팅 ───────────────────────────────────────────
  http.get("*/api/ai-chats/rooms", () => captured("GET /api/ai-chats/rooms")),
  http.get("*/api/ai-chats/rooms/:roomId/messages", () =>
    captured("GET /api/ai-chats/rooms/:id/messages"),
  ),
  http.post("*/api/ai-chats/messages", async ({ request }) => {
    const form = await request.formData();
    const roomIdValue = form.get("roomId");

    return ok(
      authored.buildChatReply(
        {
          roomId: roomIdValue ? Number(roomIdValue) : undefined,
          question: String(form.get("question") ?? ""),
        },
        form.has("image"),
      ),
    );
  }),

  /*
    첨부 사진은 Blob으로 내려받는다. 실제 이미지가 없으므로
    자리표시자 SVG를 반환해 이미지 로딩이 실패하지 않게 한다.
  */
  http.get("*/mock/symptom-photo.png", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">
      <rect width="320" height="240" fill="#E1E9FF"/>
      <text x="160" y="126" text-anchor="middle" font-family="sans-serif"
            font-size="16" fill="#684BDB">첨부 사진 (목 데이터)</text>
    </svg>`;

    return new HttpResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }),

  // ── 예약 ──────────────────────────────────────────────
  /*
    캡처 당시 진행 중 예약이 없어 빈 배열이었다.
    시연에서는 예약이 있는 상태가 필요하므로 작성본을 사용한다.
  */
  http.get("*/api/appointments", () => ok(authored.activeAppointments)),
  http.get("*/api/appointments/available-dates", () =>
    ok(authored.availableDates),
  ),
  http.get("*/api/appointments/available-slots", () =>
    captured("GET /api/appointments/available-slots"),
  ),
  http.post("*/api/appointments", () => ok(authored.createdAppointment)),
  http.delete("*/api/appointments/:appointmentId", () =>
    ok(null, "예약이 취소되었습니다."),
  ),
  http.get("*/api/appointments/:appointmentId", () =>
    ok(authored.appointmentDetail),
  ),

  // ── 사전 문진 ─────────────────────────────────────────
  http.get("*/api/preconsult-submissions", () =>
    ok(authored.preconsultSubmission),
  ),

  // ── 화상 상담 ─────────────────────────────────────────
  http.post("*/api/consultations/:appointmentId/join", () =>
    ok(authored.joinConsultation),
  ),
  http.post("*/api/consultations/:appointmentId/transcription/start", () =>
    ok(authored.startSttAgent),
  ),
  http.get("*/api/consultations/:appointmentId/transcription/status", () =>
    ok(authored.sttAgentStatus),
  ),
  http.post("*/api/consultations/:appointmentId/token/renew", () =>
    ok(authored.renewRtcToken),
  ),
  http.post("*/api/consultations/:appointmentId/captions/batch", () =>
    ok(authored.saveCaptionBatch),
  ),
  http.post("*/api/consultations/:appointmentId/end", () =>
    ok(authored.endConsultation),
  ),

  // ── 상담 이력 / 요약 (전부 실제 캡처본) ────────────────
  http.get("*/api/consultations/history", () =>
    captured("GET /api/consultations/history"),
  ),
  http.get("*/api/consultation-summaries", () =>
    captured("GET /api/consultation-summaries"),
  ),
  http.get("*/api/consultation-summaries/:summaryId", () =>
    captured("GET /api/consultation-summaries/:id"),
  ),
  http.post("*/api/consultation-summaries/:appointmentId", () =>
    captured("GET /api/consultation-summaries/:id"),
  ),
];
