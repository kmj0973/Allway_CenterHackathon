import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { IRemoteVideoTrack } from "agora-rtc-sdk-ng";

interface RemoteVideoProps {
  track: IRemoteVideoTrack | null;
  cameraOff: boolean;
  isConnecting: boolean;
  errorMessage: string;
}

function RemoteVideo({
  track,
  cameraOff,
  isConnecting,
  errorMessage,
}: RemoteVideoProps) {
  const { t } = useTranslation("consultationWaiting");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!track || !container) return;

    track.play(container, { fit: "cover" });

    return () => {
      track.stop();
    };
  }, [track]);

  const message = errorMessage
    ? errorMessage
    : isConnecting
      ? "화상 상담에 연결하고 있습니다."
      : "상대방을 기다리고 있습니다.";

  return (
    <section aria-label="상대방 영상" className="absolute inset-0 bg-[#1A1A1A]">
      <div ref={containerRef} className="size-full" />

      {!track && (
        <div className="absolute inset-0 grid place-items-center bg-[#1A1A1A] px-8">
          <p
            role={errorMessage ? "alert" : "status"}
            className="text-center text-sm leading-6 text-white/80"
          >
            {cameraOff && !errorMessage && !isConnecting
              ? t("preview.cameraOff")
              : message}
          </p>
        </div>
      )}
    </section>
  );
}

export default RemoteVideo;
