import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAftercareHome } from "@/apis/aftercare.api";
import { getChatRoomMessages, postSymptomMessage } from "@/apis/chat.api";
import logoGradient from "@/assets/brand/logo-gradient.svg";
import sidebarLeft from "@/assets/home/sidebar-left.svg";
import ChatBar from "@/components/ChatBar/ChatBar";
import HomeCard from "@/components/HomeCard/HomeCard";
import { HOME_TUTORIAL_SEEN_STORAGE_KEY } from "@/constants/storageKey";
import { useChatStore } from "@/stores/useChatStore";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import type { ChatRoomDetailResponse } from "@/types/aiChat.type";
import { getDayOffset } from "@/utils/aftercare";
import { cn } from "@/utils/cn";
import { formatCalendarDate, formatCompactDate } from "@/utils/dateTime";
import { resolveAssetUrl } from "@/utils/url";

import HistoryDrawer from "./components/HistoryDrawer";
import HomeBackdrop from "./components/HomeBackdrop";
import HomeTutorial from "./components/HomeTutorial";
import TutorialCallout from "./components/TutorialCallout";
import pointer from "./components/tutorial-assets/pointer.svg";
import pointerAlt from "./components/tutorial-assets/pointer-alt.svg";
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
  // 전송 중인 이미지 미리보기는 답변이 올 때까지 유지한다
  const [sendingImagePreview, setSendingImagePreview] = useState<string | null>(
    null,
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<0 | 1 | 2 | null>(() =>
    localStorage.getItem(HOME_TUTORIAL_SEEN_STORAGE_KEY) === null ? 0 : null,
  );

  const goNextTutorialStep = () => {
    if (tutorialStep === 0) {
      setTutorialStep(1);
      return;
    }
    if (tutorialStep === 1) {
      setTutorialStep(2);
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

  const rootRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLButtonElement>(null);
  const chatBarRef = useRef<HTMLDivElement>(null);
  const consultCardRef = useRef<HTMLDivElement>(null);
  const aftercareCardRef = useRef<HTMLDivElement>(null);

  type Anchor = { top: number; left: number };
  const [anchors, setAnchors] = useState<{
    sidebar: Anchor | null;
    chatBar: Anchor | null;
    consultCard: Anchor | null;
    aftercareCard: Anchor | null;
  }>({ sidebar: null, chatBar: null, consultCard: null, aftercareCard: null });

  const measureTutorialAnchors = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();

    const relativeAnchor = (el: HTMLElement | null): Anchor | null => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { top: rect.top - rootRect.top, left: rect.left - rootRect.left };
    };

    setAnchors({
      sidebar: relativeAnchor(sidebarRef.current),
      chatBar: relativeAnchor(chatBarRef.current),
      consultCard: relativeAnchor(consultCardRef.current),
      aftercareCard: relativeAnchor(aftercareCardRef.current),
    });
  }, []);

  useLayoutEffect(() => {
    if (tutorialStep === null) return;

    measureTutorialAnchors();
    window.addEventListener("resize", measureTutorialAnchors);
    return () => window.removeEventListener("resize", measureTutorialAnchors);
  }, [tutorialStep, measureTutorialAnchors]);

  const sendingMessageRef = useRef<HTMLDivElement>(null);
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
    isError: hasSendError,
    variables: sending,
  } = useMutation({
    mutationFn: postSymptomMessage,
    onSuccess: (data) => {
      openRoom(data.roomId);
      queryClient.setQueryData<ChatRoomDetailResponse>(
        ["aiChat", "room", data.roomId],
        (currentRoom) => {
          if (!currentRoom) return data;

          const existingMessageIds = new Set(
            currentRoom.messages.map((message) => message.messageId),
          );
          const newMessages = data.messages.filter(
            (message) => !existingMessageIds.has(message.messageId),
          );

          return {
            ...data,
            messages: [...currentRoom.messages, ...newMessages],
          };
        },
      );
      // POST 응답은 신규 대화만 포함할 수 있으므로 전체 내역과 다시 동기화한다
      void queryClient.invalidateQueries({
        queryKey: ["aiChat", "room", data.roomId],
      });
      // 마지막 대화 시각이 바뀌어 채팅방 목록 순서도 달라진다
      void queryClient.invalidateQueries({ queryKey: ["aiChat", "rooms"] });
    },
    onError: (_error, failedMessage) => {
      setDraft((currentDraft) => currentDraft || failedMessage.question);

      const failedImage = failedMessage.image;
      if (!failedImage) return;

      const restoredPreview = URL.createObjectURL(failedImage);
      setImage((currentImage) => currentImage ?? failedImage);
      setImagePreview((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(restoredPreview);
          return currentPreview;
        }

        return restoredPreview;
      });
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
    if (!isAnswering || !sending) return;

    sendingMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [isAnswering, sending]);

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
      <div
        ref={consultCardRef}
        className={cn("relative flex flex-1", spotlight(tutorialStep === 1))}
      >
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
            consultation
              ? t("consultation.title")
              : t("consultation.empty.title")
          }
          onClick={() => navigate("/consultation")}
        />
      </div>

      <div
        ref={aftercareCardRef}
        className={cn("relative flex flex-1", spotlight(tutorialStep === 2))}
      >
        <HomeCard
          badge={t("aftercare.badge", { day: dayOffset })}
          caption={procedureName}
          title={t("aftercare.title")}
          onClick={() => navigate("/aftercare")}
        />
      </div>
    </>
  );

  const tutorialCallouts = (
    <div className="pointer-events-none absolute inset-0 z-50">
      {tutorialStep === 0 && anchors.sidebar && (
        <TutorialCallout
          anchor={anchors.sidebar}
          arrowSrc={pointerAlt}
          arrowOffset={{ top: 86.8, left: 57.8 }}
          arrowSize={{ width: 28.976, height: 39.574 }}
          arrowTransformClassName="-scale-y-100 rotate-[-4.21deg]"
          textOffset={{ top: 84, left: 76 }}
          textWidth={219}
          textGapClassName="gap-2"
          title={t("tutorial.history.title")}
          description={t("tutorial.history.description")}
          preserveLineBreaks
        />
      )}

      {tutorialStep === 0 && anchors.chatBar && (
        <TutorialCallout
          anchor={anchors.chatBar}
          arrowSrc={pointer}
          arrowOffset={{ top: -33.96, left: 184.96 }}
          arrowSize={{ width: 22.584, height: 38.28 }}
          arrowTransformClassName="-scale-y-100 rotate-[169.25deg]"
          textOffset={{ top: -84, left: 8 }}
          textWidth={189}
          textGapClassName="gap-0.5"
          title={t("tutorial.chat.title")}
          description={t("tutorial.chat.description")}
        />
      )}

      {tutorialStep === 1 && anchors.consultCard && (
        <TutorialCallout
          anchor={anchors.consultCard}
          arrowSrc={pointer}
          arrowOffset={{ top: -35.54, left: 29 }}
          arrowSize={{ width: 22.59, height: 38.28 }}
          arrowTransformClassName="rotate-[-15.5deg]"
          textOffset={{ top: -134, left: 23 }}
          textWidth={198}
          textGapClassName="gap-0.5"
          title={t("tutorial.consultation.title")}
          description={t("tutorial.consultation.description")}
          titleNoWrap
        />
      )}

      {tutorialStep === 2 && anchors.aftercareCard && (
        <TutorialCallout
          anchor={anchors.aftercareCard}
          arrowSrc={pointer}
          arrowOffset={{ top: -1.79, left: -26.9 }}
          arrowSize={{ width: 22.59, height: 38.28 }}
          arrowTransformClassName="rotate-[-65.54deg]"
          textOffset={{ top: -98, left: -74 }}
          textWidth={236}
          textGapClassName="gap-0.5"
          title={t("tutorial.aftercare.title")}
          description={t("tutorial.aftercare.description")}
          titleNoWrap
        />
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex min-h-dvh flex-col",
        // viewport-fit=cover라 홈 인디케이터 높이만큼 더 띄운다
        !isConversationActive && "pb-[calc(8px+env(safe-area-inset-bottom))]",
      )}
    >
      <HomeBackdrop />

      {tutorialStep !== null && (
        <>
          <HomeTutorial onNext={goNextTutorialStep} />
          {tutorialCallouts}
        </>
      )}

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <header className="relative flex items-center justify-between px-5 pt-6">
        <button
          ref={sidebarRef}
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
                    imageUrl={resolveAssetUrl(message.imageUrl)}
                    imageAlt={t("aiChat:attachedImage")}
                    imageOpenLabel={t("aiChat:openImage")}
                    imageCloseLabel={t("aiChat:closeImage")}
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
                    <div ref={sendingMessageRef} className="scroll-mt-6">
                      <PatientMessage
                        text={sending.question}
                        imageUrl={sendingImagePreview ?? undefined}
                        imageAlt={t("aiChat:attachedImage")}
                        imageOpenLabel={t("aiChat:openImage")}
                        imageCloseLabel={t("aiChat:closeImage")}
                        variant="home"
                      />
                    </div>
                  )}

                  <div className="flex w-50 flex-col gap-4">
                    <img
                      aria-hidden
                      src={logoGradient}
                      alt=""
                      className="size-7"
                    />
                    <p className="shimmer-text text-[0.9375rem] leading-[1.4] font-medium tracking-tight">
                      {t("aiChat:thinking")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </main>

          {/*
            대화가 이 영역 뒤로 그대로 비쳐 카드가 떠 있는 것처럼 보여서,
            바탕색으로 서서히 덮어 입력창·카드가 바닥에 붙어 보이게 한다.
          */}
          <div className="sticky bottom-0 z-10 flex flex-col gap-2.5 bg-linear-to-t from-[#fdfbff] from-55% to-transparent px-5 pt-10 pb-[calc(8px+env(safe-area-inset-bottom))]">
            {hasSendError && (
              <p role="alert" className="px-2 text-sm font-medium text-red-600">
                {t("aiChat:sendError")}
              </p>
            )}

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
            <h1
              className={cn(
                "text-greeting font-bold tracking-tight whitespace-pre-line",
                locale === "ko-KR"
                  ? "text-[1.875rem] leading-[1.3]"
                  : "text-title",
              )}
            >
              {home?.patientName
                ? t("greetingWithName", { name: home.patientName })
                : t("greeting")}
            </h1>
          </div>

          <p className="text-disclaimer relative mx-auto mt-auto max-w-62 px-5 text-center text-[0.8125rem] leading-[1.4]">
            {t("disclaimer")}
          </p>

          <div className="relative mt-6.25 px-5">
            <div
              ref={chatBarRef}
              className={cn("relative", spotlight(tutorialStep === 0))}
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
            {hasSendError && (
              <p
                role="alert"
                className="mt-2 px-2 text-sm font-medium text-red-600"
              >
                {t("aiChat:sendError")}
              </p>
            )}
          </div>

          <div
            className={cn(
              "relative mt-2.5 flex gap-[9px] overflow-hidden px-5 transition-[max-height] duration-300 ease-out",
              isChatFocused ? "max-h-4.5" : "max-h-45",
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
