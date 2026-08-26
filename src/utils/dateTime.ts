import { TIME_ZONE_STORAGE_KEY } from "@/constants/storageKey";
import type { LocalDateString } from "@/types/consultationReservation.type";
import type {
  SupportedLocale,
  UserPreferences,
} from "@/types/preferences.type";

//현재 브라우저/ 실행 환경의 기본 타임존을 불러온ㄷ
export function detectTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

//올바른 시간대인지 검증하는 함수
export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string") {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getInitialTimeZone(): string {
  const savedTimeZone = localStorage.getItem(TIME_ZONE_STORAGE_KEY);

  return isValidTimeZone(savedTimeZone) ? savedTimeZone : detectTimeZone();
}

//날짜 포맷 설정 타입
export type DateTimeContext = {
  locale: SupportedLocale;
  timeZone: string;
};

//매개변수로 받을 수 있는 날짜 타입
type DateValue = string | number | Date;

//입력값을 Date 타입으로 변환하고 검증
function toDate(value: DateValue): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`);
  }

  return date;
}

/*
"YYYY-MM-DD" 문자열을 로컬 달력 날짜로 파싱하는 함수.
new Date("2025-07-10")은 UTC 자정으로 해석돼 시간대에 따라 하루가 밀리므로 직접 조립한다.
*/
export function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

/*
parseCalendarDate의 반대. Date를 "2025-07-10" 형태로 바꾼다.
toISOString은 UTC로 변환되어 하루가 밀릴 수 있으므로 쓰지 않는다.
*/
export function formatCalendarDate(date: Date): LocalDateString {
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}` as LocalDateString;
}

/*
시간 없이 날짜만 포맷하는 함수.
시술일처럼 시각 개념이 없는 달력 날짜용이라 timeZone 변환을 적용하지 않는다.
ex) 2025년 7월 10일, July 10, 2025
*/
export function formatDate(value: DateValue, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(toDate(value));
}

/*
연도 없이 월과 일만 포맷하는 함수
ex) "7월 29일", "July 29"
*/
export function formatMonthDay(
  value: DateValue,
  locale: SupportedLocale,
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
  }).format(toDate(value));
}

/*
연도를 두 자리로 줄여 짧게 포맷하는 함수
ex) "26년 7월 10일", "26年7月10日"
*/
export function formatShortDate(
  value: DateValue,
  locale: SupportedLocale,
): string {
  return new Intl.DateTimeFormat(locale, {
    year: "2-digit",
    month: "long",
    day: "numeric",
  }).format(toDate(value));
}

export function formatDottedShortDate(value: DateValue): string {
  const date = toDate(value);
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

/*
요일만 짧게 포맷하는 함수
ex) "목", "Thu"
*/
export function formatWeekday(
  value: DateValue,
  locale: SupportedLocale,
): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
    toDate(value),
  );
}

/*
예약 날짜와 시간 포맷하는 함수
ex) 2025년 7월 16일 (수) 오후 2:00, Wednesday, July 16, 2025 at 1:00 AM
*/
export function formatAppointmentDateTime(
  value: DateValue,
  { locale, timeZone }: UserPreferences,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(toDate(value));
}

/**
 * 상담 일정 카드 전용 날짜 형식.
 * 예: 2026년 8월 2일 (일) 16:15
 */
export function formatConsultationCardDateTime(
  value: DateValue,
  { locale, timeZone }: DateTimeContext,
): string {
  const date = toDate(value);
  const weekday = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
  }).format(date);
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

  const localizedDate = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

  return `${localizedDate} (${weekday}) ${time}`;
}

export function formatConfirmedDateTime(
  value: DateValue,
  { locale, timeZone }: DateTimeContext,
): string {
  const date = toDate(value);
  const dateParts = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value ?? "";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const weekday = getPart("weekday");
  const dateText =
    locale === "en-US" ? `${month}.${day}.${year}` : `${year}.${month}.${day}`;
  const timeText = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${dateText} (${weekday}) ${timeText}`;
}

/*
날짜 없이 시간만 포맷하는 함수
ex) "오후 2:00", "10:00 PM"
*/
export function formatAppointmentTime(
  value: DateValue,
  { locale, timeZone }: DateTimeContext,
  hourCycle: string = "locale",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    ...(hourCycle === "h23" && { hourCycle: "h23" }),
  }).format(toDate(value));
}

/*
예약 시작부터 종료까지 범위 표시하는 함수
ex) 2025년 7월 16일 (수) 오후 2:00~2:30
    Wednesday, July 16, 2025, 1:00–1:30 AM
*/
export function formatAppointmentRange(
  startsAt: DateValue,
  endsAt: DateValue,
  context: DateTimeContext,
): string {
  const formatter = new Intl.DateTimeFormat(context.locale, {
    timeZone: context.timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return formatter.formatRange(toDate(startsAt), toDate(endsAt));
}

/*
시간대 이름 표시 함수
ex) "대한민국 표준시", "Korean Standard Time"
*/
export function formatTimeZoneName(
  value: DateValue,
  { locale, timeZone }: DateTimeContext,
): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "long",
  }).formatToParts(toDate(value));

  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

/*
UTC 기준 시차 표시 함수
ex) "GMT+9"
*/
export function formatTimeZoneOffset(
  value: DateValue,
  { locale, timeZone }: DateTimeContext,
): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(toDate(value));

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
}

/*
요일까지 짧게 붙여 포맷하는 함수
ex) "26. 7. 30. (목)", "Thu, 07/30/26"
*/
export function formatCompactDate(
  value: DateValue,
  { locale, timeZone }: DateTimeContext,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(toDate(value));
}

/*
시간대를 반영해 날짜만 포맷하는 함수
ex) "2026년 7월 30일", "July 30, 2026"
*/
export function formatZonedDate(
  value: DateValue,
  { locale, timeZone }: DateTimeContext,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(toDate(value));
}

/*
IANA 시간대 이름에서 도시 부분만 꺼내는 함수
ex) "Asia/Tokyo" → "Tokyo", "America/New_York" → "New York"

브라우저 표준 API로는 시간대에서 도시명을 지역화해 얻을 수 없어
IANA 식별자를 그대로 읽기 좋게 다듬는다.
*/
export function getTimeZoneCity(timeZone: string): string {
  const city = timeZone.split("/").at(-1) ?? timeZone;

  return city.replaceAll("_", " ");
}

// UTC 대비 분 단위 오프셋. "GMT+9" → 540, "GMT-3:30" → -210
function getTimeZoneOffsetMinutes(
  timeZone: string,
  value: DateValue = new Date(),
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(toDate(value));

  const raw =
    parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(raw);
  if (!match) return 0;

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);

  return hours < 0 ? hours * 60 - minutes : hours * 60 + minutes;
}

export interface CityTimeZoneOption {
  value: string;
  city: string;
  offsetMinutes: number;
  offsetLabel: string;
}

/*
브라우저가 지원하는 모든 IANA 시간대를 도시 단위 옵션으로 만든다.
react-timezone-select의 기본 목록은 같은 오프셋을 쓰는 도시를 하나로 묶어버려서
도쿄·서울처럼 오프셋이 겹치는 도시를 따로 고를 수 없어, 직접 Intl로 오프셋을 계산해 채운다.
*/
export function getCityTimeZoneOptions(): CityTimeZoneOption[] {
  const now = new Date();

  return Intl.supportedValuesOf("timeZone")
    .filter((timeZone) => !timeZone.startsWith("Etc/"))
    .map((timeZone) => {
      const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, now);
      const sign = offsetMinutes < 0 ? "-" : "+";
      const abs = Math.abs(offsetMinutes);
      const offsetLabel = `GMT${sign}${Math.floor(abs / 60)}${abs % 60 ? `:${String(abs % 60).padStart(2, "0")}` : ""}`;

      return {
        value: timeZone,
        city: getTimeZoneCity(timeZone),
        offsetMinutes,
        offsetLabel,
      };
    })
    .sort(
      (a, b) =>
        a.offsetMinutes - b.offsetMinutes || a.city.localeCompare(b.city),
    );
}

// timeZone에 맞는 Date 객체를 반환
export function getCurrentMonthInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return new Date(year, month - 1, 1);
}
