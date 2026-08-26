import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { getChatRooms } from "@/apis/chat.api";
import logoMuted from "@/assets/brand/logo-muted.svg";
import wordmarkMuted from "@/assets/brand/wordmark-muted.svg";
import { useChatStore } from "@/stores/useChatStore";
import type { ChatRoomSummary } from "@/types/aiChat.type";
import { cn } from "@/utils/cn";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

type GroupId = "recent" | "older";

// 마지막 대화가 7일 이내인지에 따라 채팅방을 나눈다.
function groupRooms(rooms: ChatRoomSummary[]) {
  const now = Date.now();

  const groups: { id: GroupId; rooms: ChatRoomSummary[] }[] = [
    { id: "recent", rooms: [] },
    { id: "older", rooms: [] },
  ];

  for (const room of rooms) {
    const time = new Date(room.lastMessageAt).getTime();

    if (now - time <= 7 * DAY_MS) {
      groups[0].rooms.push(room);
    } else {
      groups[1].rooms.push(room);
    }
  }

  return groups.filter((group) => group.rooms.length > 0);
}

function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const { t } = useTranslation("settings");

  const roomId = useChatStore((state) => state.roomId);
  const openRoom = useChatStore((state) => state.openRoom);
  const startNewChat = useChatStore((state) => state.startNewChat);

  const { data: rooms } = useQuery({
    queryKey: ["aiChat", "rooms"],
    queryFn: getChatRooms,
    enabled: isOpen,
  });

  const groups = useMemo(() => groupRooms(rooms ?? []), [rooms]);

  // 열려 있는 동안 뒤 화면이 스크롤되는 것을 방지함
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  // 채팅은 홈 화면 안에서 이어지므로 방만 열고 서랍을 닫는다
  const handleSelect = (roomId: number) => {
    openRoom(roomId);
    onClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        isOpen ? "visible" : "invisible delay-300",
      )}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label={t("history.close")}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-neutral-black/30 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        aria-label={t("history.title")}
        className={cn(
          "bg-care-bg absolute inset-y-0 left-0 w-[85%] max-w-90 overflow-y-auto",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <header className="px-5 pt-5 pb-4">
          <button
            type="button"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => {
              startNewChat();
              onClose();
            }}
            className="flex items-center gap-3"
          >
            <img src={logoMuted} alt="" aria-hidden className="size-7" />
            <img src={wordmarkMuted} alt="allway" className="h-5.5 w-auto" />
          </button>
        </header>

        {groups.map((group) => (
          <section key={group.id} className="mt-6 px-5">
            <h2 className="text-[1.125rem] leading-normal font-semibold tracking-tight text-text-history px-3">
              {t(`history.${group.id}`)}
            </h2>

            <ul className="mt-2.5">
              {group.rooms.map((room) => (
                <li key={room.roomId}>
                  <button
                    type="button"
                    tabIndex={isOpen ? 0 : -1}
                    aria-current={room.roomId === roomId ? "page" : undefined}
                    onClick={() => handleSelect(room.roomId)}
                    className={cn(
                      "text-body flex h-15 w-full items-center rounded-[20px] px-3 text-left text-text-history",
                      // 가장 최근 질문만 강조된다
                      room.roomId === roomId && "bg-primary-10",
                    )}
                  >
                    <span className="truncate">{room.roomTitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </aside>
    </div>
  );
}

export default HistoryDrawer;
