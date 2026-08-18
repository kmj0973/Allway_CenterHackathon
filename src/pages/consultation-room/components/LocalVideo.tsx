import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ICameraVideoTrack } from "agora-rtc-sdk-ng";
import microphoneOffIcon from "@/assets/icons/consultation/microphone-off.svg";

interface LocalVideoProps {
  track: ICameraVideoTrack | null;
  cameraOn: boolean;
  microphoneOn: boolean;
}

function LocalVideo({ track, cameraOn, microphoneOn }: LocalVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const previousDistanceRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!track || !container) return;

    track.play(container, { fit: "cover", mirror: true });

    return () => {
      track.stop();
    };
  }, [track]);

  const updatePinchDistance = () => {
    const pointers = [...pointersRef.current.values()];

    if (pointers.length !== 2) {
      previousDistanceRef.current = null;
      return;
    }

    previousDistanceRef.current = Math.hypot(
      pointers[0].x - pointers[1].x,
      pointers[0].y - pointers[1].y,
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch") return;

    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    updatePinchDistance();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const pointers = [...pointersRef.current.values()];
    if (pointers.length !== 2) return;

    const distance = Math.hypot(
      pointers[0].x - pointers[1].x,
      pointers[0].y - pointers[1].y,
    );
    const previousDistance = previousDistanceRef.current;

    if (previousDistance && previousDistance > 0) {
      const distanceRatio = distance / previousDistance;
      setScale((current) =>
        Math.min(1.45, Math.max(1, current * distanceRatio)),
      );
    }

    previousDistanceRef.current = distance;
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    pointersRef.current.delete(event.pointerId);
    updatePinchDistance();
  };

  return (
    <section
      data-local-video
      aria-label="내 카메라 화면"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{ transform: `scale(${scale})` }}
      className="absolute right-5 top-5 h-[173px] w-[133px] origin-top-right touch-none select-none overflow-hidden rounded-[11px] border-2 border-white bg-[#333] shadow-lg transition-transform duration-100 ease-out will-change-transform landscape:h-[133px] landscape:w-[173px] motion-reduce:transition-none"
    >
      <div
        ref={containerRef}
        className={cameraOn ? "size-full" : "invisible size-full"}
      />

      {!cameraOn && (
        <div className="absolute inset-0 grid place-items-center bg-[#333] text-xs text-white/70">
          카메라 꺼짐
        </div>
      )}
      {!microphoneOn && (
        <div
          role="status"
          aria-label="마이크 음소거"
          className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-black/65"
        >
          <img src={microphoneOffIcon} alt="" className="h-[17px] w-4" />
        </div>
      )}
    </section>
  );
}

export default LocalVideo;
