import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { saveConsultationCaptionBatch } from "@/apis/consultation/room.api";
import type { ConsultationCaption } from "@/types/consultation.type";

const BATCH_SIZE = 5;
const FLUSH_INTERVAL_MS = 3_000;

export function useCaptionBatch(
  appointmentId: number | undefined,
  sessionId: number | undefined,
) {
  const pendingRef = useRef(new Map<number, ConsultationCaption>());
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current !== null) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void flushRef.current();
    }, FLUSH_INTERVAL_MS);
  }, []);

  const flush = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current;
      if (pendingRef.current.size > 0) return flushRef.current();
      return;
    }
    if (!appointmentId || !sessionId || pendingRef.current.size === 0) {
      console.info("[CaptionBatch] 저장을 건너뜁니다.", {
        appointmentId,
        sessionId,
        pendingCount: pendingRef.current.size,
      });
      return;
    }

    clearTimer();
    const snapshot = Array.from(pendingRef.current.entries());
    const task = (async () => {
      let shouldRetry = false;
      try {
        console.info("[CaptionBatch] 확정 자막 저장을 요청합니다.", {
          appointmentId,
          sessionId,
          count: snapshot.length,
        });
        await saveConsultationCaptionBatch(appointmentId, {
          sessionId,
          captions: snapshot.map(([, caption]) => caption),
        });
        snapshot.forEach(([sentenceId, caption]) => {
          if (pendingRef.current.get(sentenceId) === caption) {
            pendingRef.current.delete(sentenceId);
          }
        });
        setErrorMessage(null);
      } catch (error) {
        shouldRetry =
          !axios.isAxiosError(error) ||
          !error.response ||
          error.response.status >= 500;
        console.error("최종 자막 일괄 저장에 실패했습니다.", error);
        setErrorMessage(
          "일부 자막을 저장하지 못했습니다. 상담 종료 시 다시 시도합니다.",
        );
      } finally {
        inFlightRef.current = null;
        if (shouldRetry && pendingRef.current.size > 0) scheduleFlush();
      }
    })();

    inFlightRef.current = task;
    return task;
  }, [appointmentId, clearTimer, scheduleFlush, sessionId]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const enqueue = useCallback(
    (caption: ConsultationCaption) => {
      pendingRef.current.set(caption.sentenceId, caption);
      if (pendingRef.current.size >= BATCH_SIZE) {
        void flushRef.current();
      } else {
        scheduleFlush();
      }
    },
    [scheduleFlush],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { enqueue, flush, errorMessage };
}
