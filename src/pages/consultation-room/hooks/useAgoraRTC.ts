import { useCallback, useEffect, useRef, useState } from "react";
import AgoraRTC, {
  type ConnectionState,
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
  type UID,
} from "agora-rtc-sdk-ng";

import type {
  ConsultationCaption,
  JoinConsultationResponse,
} from "@/types/consultation.type";
import { renewConsultationRtcToken } from "@/apis/consultation/room.api";
import {
  decodeSttMessage,
  type DecodedCaption,
} from "../utils/decodeSttMessage";

type RoomConnectionState = ConnectionState | "IDLE" | "FAILED";

interface UseAgoraRTCResult {
  localVideoTrack: ICameraVideoTrack | null;
  remoteVideoTrack: IRemoteVideoTrack | null;
  remoteCameraOff: boolean;
  microphoneOn: boolean;
  cameraOn: boolean;
  speakerOn: boolean;
  connectionState: RoomConnectionState;
  errorMessage: string;
  tokenWillExpire: boolean;
  peerAudioPublished: boolean;
  caption: string | null;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleSpeaker: () => void;
  switchCamera: () => Promise<void>;
}

export function useAgoraRTC(
  roomInfo: JoinConsultationResponse | null,
  onFinalCaption?: (caption: ConsultationCaption) => void,
): UseAgoraRTCResult {
  const [client] = useState<IAgoraRTCClient>(() =>
    AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    }),
  );
  const microphoneTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const cameraTrackRef = useRef<ICameraVideoTrack | null>(null);
  const remoteUserRef = useRef<IAgoraRTCRemoteUser | null>(null);
  const joiningRef = useRef<Promise<void> | null>(null);
  const joinedRef = useRef(false);
  const speakerOnRef = useRef(true);
  const tokenRenewalRef = useRef<Promise<void> | null>(null);
  const onFinalCaptionRef = useRef(onFinalCaption);

  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<IRemoteVideoTrack | null>(null);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [microphoneOn, setMicrophoneOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [connectionState, setConnectionState] =
    useState<RoomConnectionState>("IDLE");
  const [errorMessage, setErrorMessage] = useState("");
  const [tokenWillExpire, setTokenWillExpire] = useState(false);
  const [peerAudioPublished, setPeerAudioPublished] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const captionsRef = useRef(new Map<string, DecodedCaption>());

  useEffect(() => {
    onFinalCaptionRef.current = onFinalCaption;
  }, [onFinalCaption]);

  const handleStreamMessage = useCallback(
    (uid: UID, payload: Uint8Array) => {
      if (!roomInfo || Number(uid) !== roomInfo.sttPublisherAgoraUid) return;
      const message = decodeSttMessage(payload, roomInfo.userLanguage);
      if (!message) {
        console.info("[STT] 메시지를 디코딩하지 못했습니다.", {
          publisherUid: uid,
          payloadSize: payload.byteLength,
        });
        return;
      }

      if (import.meta.env.DEV) {
        console.info("[STT][디코딩 결과]", {
          publisherUid: uid,
          requestedLanguage: roomInfo.userLanguage,
          decodedMessage: message,
          sourceLanguage: message.sourceLanguage,
        });
      }

      const previous = captionsRef.current.get(message.sentenceId);
      const merged = { ...previous, ...message };
      captionsRef.current.set(message.sentenceId, merged);
      setCaption(merged.translatedText ?? merged.sourceText ?? null);

      if (!merged.sourceFinal || !merged.sourceText || !merged.sourceLanguage) {
        console.info("[STT] 아직 저장할 수 없는 자막입니다.", {
          sentenceId: merged.sentenceId,
          sourceFinal: merged.sourceFinal,
          hasSourceText: Boolean(merged.sourceText),
          sourceLanguage: merged.sourceLanguage,
          translationFinal: merged.translationFinal,
        });
        return;
      }

      const sentenceId = Number(merged.sentenceId);
      if (
        !Number.isSafeInteger(sentenceId) ||
        merged.speakerAgoraUid < 1
      ) {
        console.warn("저장할 수 없는 STT 문장 식별자 또는 발화자 UID입니다.", merged);
        return;
      }

      onFinalCaptionRef.current?.({
        sentenceId,
        sequenceNumber: merged.sequenceNumber,
        speakerAgoraUid: merged.speakerAgoraUid,
        sourceLanguage: merged.sourceLanguage,
        sourceText: merged.sourceText,
        ...(merged.translationFinal && merged.targetLanguage
          ? {
              targetLanguage: merged.targetLanguage,
              translatedText: merged.translatedText,
            }
          : {}),
        ...(merged.textTimestamp !== undefined
          ? { textTimestamp: merged.textTimestamp }
          : {}),
        ...(merged.durationMs !== undefined
          ? { durationMs: merged.durationMs }
          : {}),
        isFinal: true,
      });
      console.info("[STT] 확정 자막을 배치 큐에 추가했습니다.", {
        sentenceId,
        speakerAgoraUid: merged.speakerAgoraUid,
      });
    },
    [roomInfo],
  );

  const handleUserPublished = useCallback(
    async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (!roomInfo || Number(user.uid) === roomInfo.sttPublisherAgoraUid) {
        return;
      }

      try {
        await client.subscribe(user, mediaType);
        remoteUserRef.current = user;

        if (mediaType === "video") {
          setRemoteVideoTrack(user.videoTrack ?? null);
          setRemoteCameraOff(false);
        }

        if (mediaType === "audio" && user.audioTrack) {
          setPeerAudioPublished(true);
          setRemoteCameraOff(!user.hasVideo);
          user.audioTrack.setVolume(speakerOnRef.current ? 100 : 0);
          user.audioTrack.play();
        }
      } catch (error) {
        console.error("상대방 미디어 구독에 실패했습니다.", error);
        setErrorMessage("상대방 영상 연결에 실패했습니다.");
      }
    },
    [client, roomInfo],
  );

  const handleUserUnpublished = useCallback(
    (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (mediaType === "video" && remoteUserRef.current?.uid === user.uid) {
        setRemoteVideoTrack(null);
        setRemoteCameraOff(true);
      }
    },
    [],
  );

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    if (remoteUserRef.current?.uid !== user.uid) return;

    remoteUserRef.current = null;
    setRemoteVideoTrack(null);
    setRemoteCameraOff(false);
  }, []);

  const handleConnectionStateChange = useCallback(
    (currentState: ConnectionState) => {
      setConnectionState(currentState);
    },
    [],
  );

  const handleTokenWillExpire = useCallback(() => {
    if (!roomInfo || tokenRenewalRef.current) return;

    setTokenWillExpire(true);

    const renewalTask = (async () => {
      try {
        const role = roomInfo.role === "의료진" ? "MEDICAL_STAFF" : "PATIENT";
        const renewed = await renewConsultationRtcToken(
          roomInfo.appointmentId,
          { role },
        );
        await client.renewToken(renewed.rtcToken);
        setTokenWillExpire(false);
      } catch (error) {
        console.error("Agora RTC 토큰 갱신에 실패했습니다.", error);
        setTokenWillExpire(true);
      } finally {
        tokenRenewalRef.current = null;
      }
    })();

    tokenRenewalRef.current = renewalTask;
  }, [client, roomInfo]);

  const removeListeners = useCallback(() => {
    client.off("user-published", handleUserPublished);
    client.off("user-unpublished", handleUserUnpublished);
    client.off("user-left", handleUserLeft);
    client.off("connection-state-change", handleConnectionStateChange);
    client.off("token-privilege-will-expire", handleTokenWillExpire);
    client.off("stream-message", handleStreamMessage);
  }, [
    handleConnectionStateChange,
    handleTokenWillExpire,
    handleUserLeft,
    handleUserPublished,
    handleUserUnpublished,
    handleStreamMessage,
    client,
  ]);

  const leave = useCallback(async () => {
    removeListeners();

    microphoneTrackRef.current?.stop();
    microphoneTrackRef.current?.close();
    cameraTrackRef.current?.stop();
    cameraTrackRef.current?.close();

    microphoneTrackRef.current = null;
    cameraTrackRef.current = null;
    remoteUserRef.current = null;
    joiningRef.current = null;
    tokenRenewalRef.current = null;
    joinedRef.current = false;

    setLocalVideoTrack(null);
    setRemoteVideoTrack(null);
    setRemoteCameraOff(false);
    setMicrophoneOn(true);
    setCameraOn(true);
    setTokenWillExpire(false);
    setPeerAudioPublished(false);
    setCaption(null);
    captionsRef.current.clear();

    if (client.connectionState !== "DISCONNECTED") {
      await client.leave();
    }

    setConnectionState("DISCONNECTED");
  }, [client, removeListeners]);

  const join = useCallback(async () => {
    if (!roomInfo || joinedRef.current) return;
    if (joiningRef.current) return joiningRef.current;

    const joinTask = (async () => {
      setConnectionState("CONNECTING");
      setErrorMessage("");

      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);
      client.on("user-left", handleUserLeft);
      client.on("connection-state-change", handleConnectionStateChange);
      client.on("token-privilege-will-expire", handleTokenWillExpire);
      client.on("stream-message", handleStreamMessage);

      try {
        await client.join(
          roomInfo.agoraAppId,
          roomInfo.rtcChannelName,
          roomInfo.rtcToken,
          roomInfo.agoraUid,
        );

        const [microphoneTrack, cameraTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        microphoneTrackRef.current = microphoneTrack;
        cameraTrackRef.current = cameraTrack;
        setLocalVideoTrack(cameraTrack);

        await client.publish([microphoneTrack, cameraTrack]);
        joinedRef.current = true;
        setConnectionState("CONNECTED");
      } catch (error) {
        console.error("Agora 상담방 연결에 실패했습니다.", error);
        setErrorMessage(
          "화상 상담 연결에 실패했습니다. 카메라와 마이크 권한을 확인해 주세요.",
        );
        setConnectionState("FAILED");
        await leave();
        throw error;
      } finally {
        joiningRef.current = null;
      }
    })();

    joiningRef.current = joinTask;
    return joinTask;
  }, [
    handleConnectionStateChange,
    handleTokenWillExpire,
    handleUserLeft,
    handleUserPublished,
    handleUserUnpublished,
    handleStreamMessage,
    client,
    leave,
    roomInfo,
  ]);

  const toggleMicrophone = useCallback(async () => {
    const track = microphoneTrackRef.current;
    if (!track) return;

    const next = !microphoneOn;
    await track.setEnabled(next);
    setMicrophoneOn(next);
  }, [microphoneOn]);

  const toggleCamera = useCallback(async () => {
    const track = cameraTrackRef.current;
    if (!track) return;

    const next = !cameraOn;
    await track.setEnabled(next);
    setCameraOn(next);
  }, [cameraOn]);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOnRef.current;
    speakerOnRef.current = next;
    remoteUserRef.current?.audioTrack?.setVolume(next ? 100 : 0);
    setSpeakerOn(next);
  }, []);

  const switchCamera = useCallback(async () => {
    const track = cameraTrackRef.current;
    if (!track) return;

    const cameras = await AgoraRTC.getCameras();
    if (cameras.length < 2) return;

    const currentLabel = track.getTrackLabel();
    const currentIndex = cameras.findIndex(
      (camera) => camera.label === currentLabel,
    );
    const nextCamera = cameras[(currentIndex + 1) % cameras.length];

    await track.setDevice(nextCamera.deviceId);
  }, []);

  useEffect(() => {
    return () => {
      void leave();
    };
  }, [leave]);

  return {
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
  };
}

export type { RoomConnectionState };
