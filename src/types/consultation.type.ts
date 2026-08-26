export type ParticipantRole = "PATIENT" | "MEDICAL_STAFF";

export type ResponseParticipantRole = "환자" | "의료진";

export interface JoinConsultationRequest {
  role: ParticipantRole;
  agoraUid: number;
  userLanguage: string;
}

export interface JoinConsultationResponse {
  appointmentId: number;
  sessionId: number;
  agoraAppId: string;
  rtcChannelName: string;
  agoraUid: number;
  rtcToken: string;
  tokenExpiresAt: string;
  role: ResponseParticipantRole;
  userLanguage: string;
  peerLanguage: string | null;
  sttPublisherAgoraUid: number;
  recommendedDurationSeconds: number;
  forceEndAt: string | null;
}

export type SttAgentStatus =
  | "NOT_STARTED"
  | "STARTING"
  | "RUNNING"
  | "STOPPING"
  | "STOPPED"
  | "FAILED";

export interface StartSttAgentResponse {
  sessionId: number;
  agentId: string;
  status: SttAgentStatus;
}

export interface SttAgentStatusResponse {
  sessionId: number;
  agentId: string | null;
  status: SttAgentStatus;
}

export interface RenewRtcTokenRequest {
  role: ParticipantRole;
}

export interface RenewRtcTokenResponse {
  rtcToken: string;
  tokenExpiresAt: string;
}

export interface ConsultationCaption {
  sentenceId: number;
  sequenceNumber: number;
  speakerAgoraUid: number;
  sourceLanguage: string;
  sourceText: string;
  targetLanguage?: string;
  translatedText?: string;
  textTimestamp?: number;
  durationMs?: number;
  isFinal: true;
}

export interface SaveCaptionBatchRequest {
  sessionId: number;
  captions: ConsultationCaption[];
}

export interface SaveCaptionBatchResponse {
  receivedCount: number;
  insertedCount: number;
  updatedCount: number;
}

export interface EndConsultationResponse {
  sessionId: number;
  status: "COMPLETED";
  startedAt: string;
  endedAt: string;
  actualDurationSeconds: number;
}

export interface ConsultationHistoryItem {
  appointmentId: number;
  sessionId: number | null;
  startedAt: string | null;
  endedAt: string | null;
  actualDurationSeconds: number | null;
  hasTranscript: boolean;
  appointmentStartsAt: string | null;
  appointmentEndsAt: string | null;
  symptomCategory: string | null;
  symptomCategories?: string[];
  symptomNote: string | null;
  status: "COMPLETED" | "CANCELLED";
  cancelReason: string | null;
  cancelledAt: string | null;
}

export type SummaryRequestLanguage = "KO" | "EN" | "JA" | "ZH";
export type SummaryResponseLanguage = "KO" | "EN-US" | "JA" | "ZH-HANS";

export interface CreateConsultationSummaryRequest {
  medicalStaffName: string;
  language: SummaryRequestLanguage;
}

export interface SummaryInstruction {
  instructionId: number;
  title: string;
  content: string;
  icon?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  sortOrder: number;
  patientCompleted: boolean;
  completedAt: string | null;
}

export interface ConsultationSummaryResponse {
  summaryId: number;
  consultedAt: string;
  medicalStaffName: string;
  actualDurationSeconds: number;
  language: SummaryResponseLanguage;
  translatedSummary: string;
  consultationDetails: string;
  instructions: SummaryInstruction[];
  sessionId: number;
}

export type ConsultationSummaryListItem = Omit<
  ConsultationSummaryResponse,
  "consultationDetails" | "instructions"
>;

export interface PreconsultSubmissionFile {
  fileId: number;
  fileUrl: string;
}

export interface PreconsultSubmissionResponse {
  submissionId: number;
  appointmentId: number;
  symptomCategory: string | null;
  symptomCategories?: string[];
  symptomNote: string | null;
  files: PreconsultSubmissionFile[];
}
