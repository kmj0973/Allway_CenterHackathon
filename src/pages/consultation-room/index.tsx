import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import axios from "axios";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useConsultationStore } from "@/stores/useConsultationStore";

import speakerIcon from "@/assets/icons/consultation-room/speaker.svg";
import speakerOffIcon from "@/assets/icons/consultation-room/speaker-off.svg";
import CaptionOverlay from "./components/CaptionOverlay";
import ConnectionStatus from "./components/ConnectionStatus";
import ConsultationControls from "./components/ConsultationControls";
import ConsultationEndModal from "./components/ConsultationEndModal";
import LocalVideo from "./components/LocalVideo";
import RemoteVideo from "./components/RemoteVideo";
import { useAgoraRTC } from "./hooks/useAgoraRTC";
import { useStartSttAgent } from "./hooks/useStartSttAgent";
import { useSttAgentStatus } from "./hooks/useSttAgentStatus";
import { useCaptionBatch } from "./hooks/useCaptionBatch";
import { useEndConsultation } from "./hooks/useEndConsultation";
import { useCreateConsultationSummary } from "./hooks/useCreateConsultationSummary";
import type { ApiErrorResponse } from "@/types/api.type";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import { toSummaryRequestLanguage } from "@/pages/consultation-summary/utils/consultationSummary";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function ConsultationRoomPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [searchParams] = useSearchParams();
  const role =
    searchParams.get("role")?.toUpperCase() === "MEDICAL_STAFF"
      ? "MEDICAL_STAFF"
      : "PATIENT";
  const roomInfo = useConsultationStore((state) => state.roomInfo);
  const clearRoomInfo = useConsultationStore((state) => state.clearRoomInfo);
  const locale = usePreferencesStore((state) => state.locale);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sttRequestedRef = useRef(false);
  const [sttErrorMessage, setSttErrorMessage] = useState<string | null>(null);
  const [endErrorMessage, setEndErrorMessage] = useState<string | null>(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isEndProcessing, setIsEndProcessing] = useState(false);
  const endProcessingRef = useRef(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const { mutateAsync: startSttAgent } = useStartSttAgent();
  const { mutateAsync: endConsultation, isPending: isEnding } =
    useEndConsultation();
  const {
    mutateAsync: createConsultationSummary,
    isPending: isCreatingSummary,
  } = useCreateConsultationSummary();
  const {
    enqueue: enqueueCaption,
    flush: flushCaptions,
    errorMessage: captionSaveError,
  } = useCaptionBatch(roomInfo?.appointmentId, roomInfo?.sessionId);

  const {
    localVideoTrack,
    remoteVideoTrack,
    remoteCameraOff,
    microphoneOn,
    cameraOn,
    speakerOn,
    connectionState,
    errorMessage,
    tokenWillExpire,
    peerAudioPublished,
    caption,
    join,
    leave,
    toggleMicrophone,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
  } = useAgoraRTC(roomInfo, enqueueCaption);

  const {
    data: sttAgent,
    isFetched: isSttStatusFetched,
    isError: isSttStatusError,
  } = useSttAgentStatus(
    roomInfo?.appointmentId,
    connectionState === "CONNECTED",
  );

  const waitingPath = useMemo(
    () => `/consultation/${appointmentId ?? ""}/waiting?role=${role}`,
    [appointmentId, role],
  );

  useEffect(() => {
    if (!roomInfo) {
      // 상담 종료 과정에서는 roomInfo를 비운 뒤 요약/상담 허브로 이동한다.
      // 이때 대기실 리다이렉트가 종료 후 라우팅을 가로채지 않도록 한다.
      if (endProcessingRef.current) return;

      navigate(waitingPath, { replace: true });
      return;
    }

    // Strict Mode의 effect 재실행 전에 첫 join이 시작되지 않도록 다음 task로 미룹니다.
    const joinTimer = window.setTimeout(() => {
      void join().catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(joinTimer);
  }, [join, navigate, roomInfo, waitingPath]);

  useEffect(() => {
    if (connectionState !== "CONNECTED") return;

    const timerId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1_000);

    return () => window.clearInterval(timerId);
  }, [connectionState]);

  useEffect(() => {
    if (
      !roomInfo ||
      !peerAudioPublished ||
      !isSttStatusFetched ||
      sttRequestedRef.current
    )
      return;

    if (
      sttAgent?.status === "STARTING" ||
      sttAgent?.status === "RUNNING" ||
      sttAgent?.status === "STOPPING"
    ) {
      sttRequestedRef.current = true;
      return;
    }

    sttRequestedRef.current = true;

    const start = async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await startSttAgent(roomInfo.appointmentId);
          setSttErrorMessage(null);
          return;
        } catch (error) {
          const code = axios.isAxiosError<ApiErrorResponse>(error)
            ? error.response?.data.code
            : undefined;
          if (code === "CONSULTATION_409_2" && attempt < 2) {
            await new Promise((resolve) => window.setTimeout(resolve, 1_000));
            continue;
          }
          setSttErrorMessage(
            code === "CONSULTATION_409_2"
              ? "상대방 정보가 등록되지 않아 자막을 시작하지 못했습니다."
              : "자막을 사용할 수 없습니다. 영상 상담은 계속할 수 있습니다.",
          );
          return;
        }
      }
    };

    void start();
  }, [
    isSttStatusError,
    isSttStatusFetched,
    peerAudioPublished,
    roomInfo,
    startSttAgent,
    sttAgent?.status,
  ]);

  const handleEnd = async () => {
    if (!roomInfo || endProcessingRef.current || isEnding || isCreatingSummary)
      return;

    setEndErrorMessage(null);
    endProcessingRef.current = true;
    setIsEndProcessing(true);
    try {
      await flushCaptions();
      await endConsultation(roomInfo.appointmentId);
      await leave();

      // 상대방이 입장하지 않았다면 STT 확정 자막이 없으므로
      // 생성할 수 없는 상담 요약 API를 호출하지 않는다.
      if (!peerAudioPublished) {
        clearRoomInfo();
        navigate("/consultation", { replace: true });
        return;
      }

      const language = toSummaryRequestLanguage(locale);
      const summary = await createConsultationSummary({
        appointmentId: roomInfo.appointmentId,
        request: {
          medicalStaffName: "박지태 의사",
          language,
        },
      });

      clearRoomInfo();
      setIsEndModalOpen(false);
      navigate(`/consultation/summary/${summary.summaryId}`, {
        replace: true,
      });
    } catch (error) {
      endProcessingRef.current = false;
      setIsEndProcessing(false);
      const code = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data.code
        : undefined;
      setEndErrorMessage(
        code === "CONSULTATION_SUMMARY_409_2"
          ? "저장된 최종 자막이 없어 상담 요약을 만들 수 없습니다."
          : code === "CONSULTATION_SUMMARY_502_1"
            ? "AI 상담 요약 생성에 실패했습니다. 다시 시도해주세요."
            : code === "CONSULTATION_404_1"
              ? "종료할 화상상담 세션을 찾을 수 없습니다."
              : code === "APPOINTMENT_409_7"
                ? "이미 취소된 예약입니다."
                : "상담을 종료하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  };

  const isFinishingConsultation =
    isEndProcessing || isEnding || isCreatingSummary;
  const controlsDisabled =
    connectionState !== "CONNECTED" || isFinishingConsultation;
  const visibleSttErrorMessage = isSttStatusError
    ? "자막 상태를 확인하지 못했습니다. 영상 상담은 계속할 수 있습니다."
    : sttErrorMessage;
  const visibleCaptionErrorMessage =
    endErrorMessage ?? visibleSttErrorMessage ?? captionSaveError;

  const handleRoomClick = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("button, [data-local-video]")) return;

    setControlsVisible((current) => !current);
  };

  return (
    <main
      onClick={handleRoomClick}
      className="relative isolate h-full w-full overflow-hidden bg-[#1A1A1A] text-white [container-type:inline-size]"
    >
      <RemoteVideo
        track={remoteVideoTrack}
        cameraOff={remoteCameraOff}
        isConnecting={
          connectionState === "IDLE" || connectionState === "CONNECTING"
        }
        errorMessage={errorMessage}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />

      <button
        type="button"
        aria-label={speakerOn ? "상대방 소리 끄기" : "상대방 소리 켜기"}
        aria-pressed={speakerOn}
        onClick={toggleSpeaker}
        className="absolute left-[30px] top-[30px] grid size-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <span className="relative block size-6">
          <img
            src={speakerOn ? speakerIcon : speakerOffIcon}
            alt=""
            className="size-6 object-contain"
          />
        </span>
      </button>

      <time className="absolute left-1/2 top-[30px] -translate-x-1/2 text-sm leading-5 tracking-[-0.35px]">
        {formatDuration(elapsedSeconds)}
      </time>

      <LocalVideo
        track={localVideoTrack}
        cameraOn={cameraOn}
        microphoneOn={microphoneOn}
      />

      <ConnectionStatus
        connectionState={connectionState}
        tokenWillExpire={tokenWillExpire}
      />

      {visibleCaptionErrorMessage && (
        <div
          role="status"
          className="absolute left-1/2 top-16 w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-center text-xs text-white"
        >
          {visibleCaptionErrorMessage}
        </div>
      )}

      <p className="absolute bottom-5 left-[30px] whitespace-nowrap text-[clamp(9px,2.5cqw,15px)] leading-[1.4] tracking-[-0.025em] sm:bottom-[18px]">
        박지태 의사
      </p>

      <div className="absolute inset-x-0 bottom-[calc(8px+env(safe-area-inset-bottom))] flex flex-col items-center gap-2 px-4 sm:bottom-[calc(10px+env(safe-area-inset-bottom))]">
        <CaptionOverlay caption={caption} />

        <div
          aria-hidden={!controlsVisible}
          inert={!controlsVisible}
          className={[
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            controlsVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          ].join(" ")}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={[
                "transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
                controlsVisible
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-full opacity-0",
              ].join(" ")}
            >
              <ConsultationControls
                microphoneOn={microphoneOn}
                cameraOn={cameraOn}
                disabled={controlsDisabled}
                ending={isFinishingConsultation}
                onToggleMicrophone={toggleMicrophone}
                onToggleCamera={toggleCamera}
                onSwitchCamera={switchCamera}
                onEnd={() => setIsEndModalOpen(true)}
                onBackgroundClick={() => setControlsVisible(false)}
              />
            </div>
          </div>
        </div>
      </div>

      <ConsultationEndModal
        open={isEndModalOpen}
        ending={isFinishingConsultation}
        onContinue={() => setIsEndModalOpen(false)}
        onConfirm={handleEnd}
      />
    </main>
  );
}

export default ConsultationRoomPage;
