import { useRef, useState, type PointerEvent } from "react";

import { cn } from "@/utils/cn";

const ITEM_WIDTH = 88;
// 탭과 드래그를 구분하는 최소 이동 거리(px)
const DRAG_THRESHOLD = 4;

export interface WheelOption {
  value: number;
  label: string;
}

interface WheelPickerProps {
  label: string;
  options: readonly WheelOption[];
  value: number;
  onChange: (value: number) => void;
}

/**
 * iOS Safari에서 overflow-x-auto 기반 네이티브 스크롤(+ scrollTo 보정)이
 * 신뢰할 수 없게 동작해(프로그램적 위치 보정이 무시되거나 되돌아감),
 * 브라우저 스크롤에 기대지 않고 포인터 좌표를 직접 추적해 위치를 계산한다.
 */
function WheelPicker({ label, options, value, onChange }: WheelPickerProps) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const maxOffset = Math.max(0, (options.length - 1) * ITEM_WIDTH);
  const clamp = (offset: number) => Math.min(Math.max(offset, 0), maxOffset);

  const [offset, setOffset] = useState(() =>
    clamp(Math.max(selectedIndex, 0) * ITEM_WIDTH),
  );
  const [isDragging, setIsDragging] = useState(false);
  // 외부에서 값이 바뀌었는지(예: 월이 바뀌어 일이 clamp될 때) 렌더링 중에 비교하기 위한 추적값.
  const [syncedIndex, setSyncedIndex] = useState(selectedIndex);

  if (!isDragging && selectedIndex >= 0 && selectedIndex !== syncedIndex) {
    setSyncedIndex(selectedIndex);
    setOffset(clamp(selectedIndex * ITEM_WIDTH));
  }

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startOffset: number;
  } | null>(null);
  // pointerup 이후 뒤따라오는 click을 억제하기 위한 값. dragRef는 endDrag에서
  // 곧바로 비워지므로, click 시점까지 살아있는 별도 ref로 드래그 여부를 기억한다.
  const movedRef = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offset,
    };
    movedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) movedRef.current = true;

    setOffset(clamp(drag.startOffset - delta));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);

    const index = Math.round(clamp(offset) / ITEM_WIDTH);
    setOffset(index * ITEM_WIDTH);
    setSyncedIndex(index);

    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="flex w-full flex-col items-center"
    >
      <div
        className="w-full touch-none overflow-hidden px-[calc(50%-44px)]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={cn(
            "flex select-none",
            !isDragging && "transition-transform duration-150 ease-out",
          )}
          style={{ transform: `translateX(${-offset}px)` }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                aria-current={isSelected}
                onClick={() => {
                  if (movedRef.current) return;
                  onChange(option.value);
                }}
                className="flex w-22 shrink-0 flex-col items-center gap-3"
              >
                <span
                  className={cn(
                    "text-[2rem] leading-normal tracking-tight",
                    isSelected
                      ? "font-semibold text-neutral-white"
                      : "text-onboarding-wheel-muted font-medium",
                  )}
                >
                  {option.label}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-2.5 w-1.5",
                    isSelected ? "bg-accent" : "bg-onboarding-wheel-muted",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div aria-hidden className="bg-onboarding-wheel-muted h-1 w-full" />
    </div>
  );
}

export default WheelPicker;
