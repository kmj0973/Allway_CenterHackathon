import { useRef, useState, type PointerEvent } from "react";

import { cn } from "@/utils/cn";

const ITEM_HEIGHT = 60;

const SURROUNDING_COUNT = 2;

const WHEEL_HEIGHT = (SURROUNDING_COUNT * 2 + 1) * ITEM_HEIGHT;

// 탭과 드래그를 구분하는 최소 이동 거리(px)
const DRAG_THRESHOLD = 4;

// 원통 효과
function getItemStyle(distance: number) {
  if (distance === 0) {
    return { transform: "rotateX(0deg)", opacity: 1 };
  }

  const direction = distance > 0 ? -1 : 1;
  const step = Math.min(Math.abs(distance), SURROUNDING_COUNT);

  return {
    transform: `rotateX(${direction * step * 28}deg) scale(${1 - step * 0.08})`,
    opacity: 1 - step * 0.35,
  };
}

export interface VerticalWheelOption<T extends string> {
  value: T;
  label: string;
}

interface VerticalWheelPickerProps<T extends string> {
  label: string;
  options: readonly VerticalWheelOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * iOS Safari에서 overflow-y-auto 기반 네이티브 스크롤(+ scrollTo 보정)이
 * 신뢰할 수 없게 동작해(프로그램적 위치 보정이 무시되거나 되돌아감),
 * 브라우저 스크롤에 기대지 않고 포인터 좌표를 직접 추적해 위치를 계산한다.
 */
function VerticalWheelPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: VerticalWheelPickerProps<T>) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const maxOffset = Math.max(0, (options.length - 1) * ITEM_HEIGHT);
  const clamp = (offset: number) => Math.min(Math.max(offset, 0), maxOffset);

  const [offset, setOffset] = useState(() =>
    clamp(Math.max(selectedIndex, 0) * ITEM_HEIGHT),
  );
  const [isDragging, setIsDragging] = useState(false);
  // 외부에서 값이 바뀌었는지 렌더링 중에 비교하기 위한 추적값.
  const [syncedIndex, setSyncedIndex] = useState(selectedIndex);

  if (!isDragging && selectedIndex >= 0 && selectedIndex !== syncedIndex) {
    setSyncedIndex(selectedIndex);
    setOffset(clamp(selectedIndex * ITEM_HEIGHT));
  }

  const centeredIndex = Math.round(offset / ITEM_HEIGHT);

  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startOffset: number;
  } | null>(null);
  // pointerup 이후 뒤따라오는 click을 억제하기 위한 값. dragRef는 endDrag에서
  // 곧바로 비워지므로, click 시점까지 살아있는 별도 ref로 드래그 여부를 기억한다.
  const movedRef = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: offset,
    };
    movedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > DRAG_THRESHOLD) movedRef.current = true;

    setOffset(clamp(drag.startOffset - delta));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);

    const index = Math.round(clamp(offset) / ITEM_HEIGHT);
    setOffset(index * ITEM_HEIGHT);
    setSyncedIndex(index);

    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="relative w-52.5"
      style={{ height: WHEEL_HEIGHT }}
    >
      {/* 가운데 선택 영역 */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-15 w-38 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/36"
      />

      <div
        className="h-full touch-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={cn(
            "select-none",
            !isDragging && "transition-transform duration-150 ease-out",
          )}
          style={{
            perspective: "600px",
            paddingBlock: SURROUNDING_COUNT * ITEM_HEIGHT,
            transform: `translateY(${-offset}px)`,
          }}
        >
          {options.map((option, index) => {
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
                style={getItemStyle(index - centeredIndex)}
                className={cn(
                  "text-heading text-onboarding-title flex h-15 w-full items-center justify-center",
                  "font-semibold transition-[transform,opacity] duration-150",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VerticalWheelPicker;
