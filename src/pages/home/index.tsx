import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getChatRoomMessages, postSymptomMessage } from "@/apis/chat";
import { getAftercareHome } from "@/apis/patient";
import logoDark from "@/assets/logo-dark.svg";
import sidebarLeft from "@/assets/sidebar-left.svg";
import ChatBar from "@/components/ChatBar/ChatBar";
import HomeCard from "@/components/HomeCard/HomeCard";
import { HOME_TUTORIAL_SEEN_STORAGE_KEY } from "@/constants/storageKey";
import { useChatStore } from "@/stores/useChatStore";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import { getDayOffset } from "@/utils/aftercare";
import { cn } from "@/utils/cn";
import { formatCalendarDate, formatCompactDate } from "@/utils/dateTime";

import HistoryDrawer from "./components/HistoryDrawer";
import HomeBackdrop from "./components/HomeBackdrop";
import HomeTutorial from "./components/HomeTutorial";
import AiAnswer from "./components/AiAnswer";
import ChatComposer from "./components/ChatComposer";
import PatientMessage from "./components/PatientMessage";

function HomePage() {
  const { t } = useTranslation(["home", "aiChat"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const locale = usePreferencesStore((state) => state.locale);
  const timeZone = usePreferencesStore((state) => state.timeZone);
  const roomId = useChatStore((state) => state.roomId);
  const openRoom = useChatStore((state) => state.openRoom);

  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // 전송 중인 메시지 말풍선에 쓰는 미리보기. 전송 즉시 입력창 미리보기는 지워지지만
  // 답변이 돌아올 때까지는 이걸로 계속 보여준다
  const [sendingImagePreview, setSendingImagePreview] = useState<
    string | null
  >(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [showCards, setShowCards] = useState(false);
  // 0·1은 진행 중인 안내 단계, null이면 이미 봤거나 다 본 상태
  const [tutorialStep, setTutorialStep] = useState<0 | 1 | null>(() =>
    localStorage.getItem(HOME_TUTORIAL_SEEN_STORAGE_KEY) === null ? 0 : null,
  );

  const goNextTutorialStep = () => {
    if (tutorialStep === 0) {
      setTutorialStep(1);
      return;
    }

    localStorage.setItem(HOME_TUTORIAL_SEEN_STORAGE_KEY, "true");
    setTutorialStep(null);
  };

  /*
    강조할 요소를 오버레이(z-40) 위로 올려 그 부분만 밝게 보이게 한다.
    pointer-events-none을 함께 줘서, 눌러도 카드로 이동하지 않고 아래 오버레이가 탭을 받아
    다음 단계로 넘어가게 한다.
  */
  const spotlight = (isLit: boolean) =>
    isLit ? "z-50 pointer-events-none" : undefined;

  const bottomRef = useRef<HTMLDivElement>(null);
  const cardsTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // 위로 스와이프한 걸로 인정할 최소 이동 거리(px)
  const SWIPE_UP_THRESHOLD = 24;

  /*
    대화 중에는 카드가 평소엔 접혀 있다가, 위로 스와이프하면 잠깐(5초) 펼쳐진다.
    그 뒤로 다시 스와이프하지 않으면(반응 없으면) 5초 뒤에 저절로 접힌다.
    이전 타이머는 취소해서 연속으로 스와이프할 때 계속 5초씩 늘어나지 않게 한다.
  */
  const flashCards = () => {
    setShowCards(true);
    if (cardsTimerRef.current) window.clearTimeout(cardsTimerRef.current);
    cardsTimerRef.current = window.setTimeout(() => setShowCards(false), 5000);
  };

  const handleCardsTouchStart = (event: TouchEvent) => {
    touchStartYRef.current = event.touches[0].clientY;
  };

  const handleCardsTouchEnd = (event: TouchEvent) => {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY === null) return;

    const deltaY = startY - event.changedTouches[0].clientY;
    if (deltaY >= SWIPE_UP_THRESHOLD) flashCards();
  };

  useEffect(() => {
    return () => {
      if (cardsTimerRef.current) window.clearTimeout(cardsTimerRef.current);
    };
  }, []);

  const { data: home } = useQuery({
    queryKey: ["aftercare", "home"],
    queryFn: getAftercareHome,
  });

  const { data: room } = useQuery({
    queryKey: ["aiChat", "room", roomId],
    queryFn: () => getChatRoomMessages(roomId as number),
    enabled: roomId !== null,
  });

  const messages = useMemo(() => room?.messages ?? [], [room]);

  const {
    mutate: send,
    isPending: isAnswering,
    variables: sending,
  } = useMutation({
    mutationFn: postSymptomMessage,
    onSuccess: (data) => {
      openRoom(data.roomId);
      queryClient.setQueryData(["aiChat", "room", data.roomId], data);
      // 마지막 대화 시각이 바뀌어 채팅방 목록 순서도 달라진다
      void queryClient.invalidateQueries({ queryKey: ["aiChat", "rooms"] });
    },
    onSettled: () => {
      setSendingImagePreview((preview) => {
        if (preview) URL.revokeObjectURL(preview);
        return null;
      });
    },
  });

  const isConversationActive = messages.length > 0 || isAnswering;

  const dayOffset = home?.aftercareProgress.elapsedDays ?? 0;
  const cautionDays = home?.aftercareProgress.totalCareDays ?? 0;
  const procedureName = home?.procedure.procedureName ?? "";

  const consultation = useMemo(() => {
    const appointment = home?.consultationAppointment;
    if (!appointment) return null;

    const scheduledAt = new Date(appointment.startsAt);

    return {
      date: formatCompactDate(scheduledAt, { locale, timeZone }),
      // 상담일이 미래면 getDayOffset이 음수를 주므로 부호를 뒤집는다
      daysLeft: -getDayOffset(formatCalendarDate(scheduledAt)),
    };
  }, [home?.consultationAppointment, locale, timeZone]);

  useEffect(() => {
    if (!isConversationActive) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isAnswering, isConversationActive]);

  // 화면을 떠날 때 아직 안 보낸/안 지운 미리보기가 남아있으면 정리한다
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectImage = (file: File) => {
    // 보내지 않고 다른 사진으로 바꾼 경우, 이전 미리보기는 여기서 정리한다
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImage(null);
    setImagePreview(null);
  };

  const sendToChat = () => {
    const question = draft.trim();
    if ((!question && !image) || isAnswering) return;

    // 전송 중 말풍선에 쓰도록 미리보기 소유권을 넘긴다 (URL은 응답이 온 뒤 정리)
    setSendingImagePreview(imagePreview);
    setImage(null);
    setImagePreview(null);

    send({
      roomId: roomId ?? undefined,
      question,
      image: image ?? undefined,
    });

    setDraft("");
  };

  const homeCards = (
    <>
      <HomeCard
        variant="consultation"
        badge={
          consultation
            ? t("consultation.badge", { days: consultation.daysLeft })
            : t("consultation.empty.badge")
        }
        caption={
          consultation
            ? t("consultation.scheduled", { date: consultation.date })
            : t("consultation.empty.caption")
        }
        title={
          consultation ? t("consultation.title") : t("consultation.empty.title")
        }
        onClick={() => navigate("/consultation")}
      />

      <HomeCard
        badge={t("aftercare.badge", { day: dayOffset })}
        caption={procedureName}
        title={t("aftercare.title")}
        onClick={() => navigate("/aftercare")}
      />
    </>
  );

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col",
        // viewport-fit=cover라 홈 인디케이터 높이만큼 더 띄운다
        !isConversationActive && "pb-[calc(8px+env(safe-area-inset-bottom))]",
      )}
    >
      <HomeBackdrop />

      {tutorialStep !== null && (
        <HomeTutorial step={tutorialStep} onNext={goNextTutorialStep} />
      )}

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <header className="relative flex items-center justify-between px-5 pt-6">
        <button
          type="button"
          aria-label={t("menu")}
          onClick={() => setIsHistoryOpen(true)}
          className={cn(
            "bg-neutral-white/70 relative flex size-14.5 items-center justify-center rounded-[30px]",
            spotlight(tutorialStep === 0),
          )}
        >
          <img aria-hidden src={sidebarLeft} alt="" className="size-5.25" />
        </button>

        <button
          type="button"
          aria-label={t("changeLanguage")}
          onClick={() => navigate("/settings/language")}
          className="bg-neutral-white/70 flex size-14.5 items-center justify-center rounded-[30px] text-[#47425b] transition-colors"
        >
          <span aria-hidden className="text-[1.0625rem] font-bold">
            가
            <span className="text-[0.8125rem] font-medium text-[#68657c] opacity-70">
              가
            </span>
          </span>
        </button>
      </header>

      {isConversationActive ? (
        <>
          <main className="relative flex-1 px-5 pt-6 pb-6">
            <div className="flex flex-col gap-10">
              {messages.map((message) =>
                message.role === "USER" ? (
                  <PatientMessage
                    key={message.messageId}
                    text={message.content}
                    imageUrl={message.imageUrl ?? undefined}
                    imageAlt={t("aiChat:attachedImage")}
                    variant="home"
                  />
                ) : (
                  <AiAnswer
                    key={message.messageId}
                    content={message.content}
                    variant="home"
                  />
                ),
              )}

              {isAnswering && (
                <>
                  {sending && (
                    <PatientMessage
                      text={sending.question}
                      imageUrl={sendingImagePreview ?? undefined}
                      imageAlt={t("aiChat:attachedImage")}
                      variant="home"
                    />
                  )}

                  <div className="flex w-50 flex-col gap-4">
                    <img aria-hidden src={logoDark} alt="" className="size-7" />
                    <p className="shimmer-text text-[0.9375rem] leading-[1.4] font-medium tracking-tight">
                      {t("aiChat:thinking")}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div ref={bottomRef} />
          </main>

          {/*
            대화가 이 영역 뒤로 그대로 비쳐 카드가 떠 있는 것처럼 보여서,
            바탕색으로 서서히 덮어 입력창·카드가 바닥에 붙어 보이게 한다.
          */}
          <div className="sticky bottom-0 z-10 flex flex-col gap-2.5 bg-linear-to-t from-[#fdfbff] from-55% to-transparent px-5 pt-10 pb-[calc(8px+env(safe-area-inset-bottom))]">
            <ChatComposer
              value={draft}
              placeholder={t("aiChat:inputPlaceholder")}
              attachLabel={t("aiChat:attach")}
              cameraLabel={t("aiChat:camera")}
              photoLabel={t("aiChat:photo")}
              sendLabel={t("aiChat:send")}
              stopLabel={t("aiChat:stop")}
              imagePreview={imagePreview}
              isAnswering={isAnswering}
              variant="home"
              onChange={setDraft}
              onSubmit={sendToChat}
              onImageSelect={selectImage}
              onRemoveImage={removeImage}
              onStop={() => undefined}
            />

            <div
              onTouchStart={handleCardsTouchStart}
              onTouchEnd={handleCardsTouchEnd}
              className={cn(
                "relative flex gap-[9px] overflow-hidden transition-[max-height] duration-300 ease-out",
                showCards ? "max-h-45" : "max-h-4.5",
              )}
            >
              {homeCards}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="relative mx-auto mt-14 flex max-w-75 flex-col items-center gap-2 px-5 text-center">
            <p className="text-text-02 text-[1.25rem] leading-[1.45] font-medium tracking-tight">
              {t("progress.day", { day: dayOffset })}
              {t("progress.total", { total: cautionDays })}
            </p>
            <h1 className="text-title text-greeting font-bold tracking-tight">
              {t("greeting")}
            </h1>
          </div>

          <p className="text-disclaimer relative mx-auto mt-auto max-w-62 px-5 text-center text-[0.8125rem] leading-[1.4]">
            {t("disclaimer")}
          </p>

          <div
            className={cn("relative mt-6.25 px-5", spotlight(tutorialStep === 0))}
          >
            <ChatBar
              value={draft}
              placeholder={t("chat.placeholder")}
              attachLabel={t("chat.attach")}
              cameraLabel={t("chat.camera")}
              photoLabel={t("chat.photo")}
              sendLabel={t("chat.send")}
              imagePreview={imagePreview}
              onChange={setDraft}
              onSubmit={sendToChat}
              onImageSelect={selectImage}
              onRemoveImage={removeImage}
              onFocus={() => setIsChatFocused(true)}
              onBlur={() => setIsChatFocused(false)}
            />
          </div>

          <div
            className={cn(
              "relative mt-2.5 flex gap-[9px] overflow-hidden px-5 transition-[max-height] duration-300 ease-out",
              isChatFocused ? "max-h-4.5" : "max-h-45",
              spotlight(tutorialStep === 1),
            )}
          >
            {homeCards}
          </div>
        </>
      )}
    </div>
  );
}

export default HomePage;
