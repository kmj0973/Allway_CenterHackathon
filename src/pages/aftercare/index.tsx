import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getAftercareDashboard } from "@/apis/aftercare.api";
import backButton from "@/assets/aftercare/back-button.svg";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import { getWeekAround } from "@/utils/aftercare";
import {
  formatDottedShortDate,
  formatMonthDay,
  parseCalendarDate,
} from "@/utils/dateTime";

import AlertCard from "./components/AlertCard";
import NoticeFooter from "./components/NoticeFooter";
import PhaseSummaryCard from "./components/PhaseSummaryCard";
import PhaseTimeline, { type TimelinePhase } from "./components/PhaseTimeline";
import ReportCard from "./components/ReportCard";
import WeekStrip from "./components/WeekStrip";

function AftercarePage() {
  const { t } = useTranslation("aftercare");
  const navigate = useNavigate();

  const locale = usePreferencesStore((state) => state.locale);

  const [isExpanded, setIsExpanded] = useState(false);

  const today = useMemo(() => new Date(), []);

  const { data: dashboard } = useQuery({
    queryKey: ["aftercare", "dashboard"],
    queryFn: getAftercareDashboard,
  });

  const dayOffset = dashboard?.caseStatus.currentDay ?? 0;
  const procedureDate = dashboard?.caseStatus.procedureDate ?? null;
  const procedureName = dashboard?.caseStatus.procedureName ?? "";
  const recoveryGuides = dashboard?.recoveryGuides ?? [];
  const redFlagItems = dashboard?.redFlags.items ?? [];

  // 오늘을 세 번째 칸에 배치
  const weekDays = useMemo(
    () => getWeekAround(today, { before: 1, after: 5 }),
    [today],
  );

  const currentGuide =
    recoveryGuides.find((guide) => guide.status === "CURRENT") ??
    recoveryGuides[0];

  // 단계명·가이드 문구는 서버가 내려주는 값 그대로 쓴다(현재 한국어만 제공).
  // 구간 표시만 startDay/endDay로 프론트에서 locale에 맞춰 조립한다.
  const timelinePhases: TimelinePhase[] = recoveryGuides.map((guide) => ({
    id: String(guide.stageGuideId),
    label: guide.recoveryStage,
    range:
      guide.endDay === null
        ? t("stageRangeOpen", { from: guide.startDay })
        : t("stageRange", { from: guide.startDay, to: guide.endDay }),
    items: guide.guideItems,
    isCurrent: guide.status === "CURRENT",
  }));

  return (
    <div className="bg-care-bg relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10.5 -left-7 size-112.5 rounded-full blur-[50px]"
        style={{
          backgroundImage:
            "linear-gradient(197deg, #e1e9ff 29%, rgba(255,255,255,0.52) 100%)",
        }}
      />

      <header className="relative h-16.5">
        <button
          type="button"
          aria-label={t("back")}
          onClick={() => navigate("/home")}
          className="absolute top-1 left-1 flex size-14 items-center justify-center"
        >
          <img aria-hidden src={backButton} alt="" className="size-6" />
        </button>

        <h1 className="text-care-title absolute top-5 left-1/2 -translate-x-1/2 text-[1.25rem] leading-[1.4] font-semibold tracking-[-0.025em]">
          {t("pageTitle")}
        </h1>
      </header>

      <div className="relative mt-10 flex items-start justify-between px-5">
        <h2 className="text-care-title text-title leading-[1.25] font-semibold tracking-tight">
          {t("dayCount", { day: dayOffset })}
        </h2>

        <div className="w-21 text-right">
          <p className="text-care-date text-[1.25rem] leading-[1.25] font-semibold tracking-[-0.035em]">
            {formatMonthDay(today, locale)}
          </p>
          <p className="text-care-year text-[1.25rem] leading-[1.25] font-semibold tracking-[-0.035em]">
            {today.getFullYear()}
          </p>
        </div>
      </div>

      <div className="relative mt-7">
        <WeekStrip days={weekDays} today={today} locale={locale} />
      </div>

      <div className="relative mt-7.5 px-5">
        <PhaseSummaryCard
          label={currentGuide?.recoveryStage ?? ""}
          headline={currentGuide?.recoveryStage ?? ""}
          procedureDate={
            procedureDate
              ? formatDottedShortDate(parseCalendarDate(procedureDate))
              : ""
          }
          procedureName={procedureName}
          isExpanded={isExpanded}
          toggleLabel={t(isExpanded ? "toggle.collapse" : "toggle.expand")}
          onToggle={() => setIsExpanded((expanded) => !expanded)}
        />
      </div>

      {isExpanded && (
        <div className="relative">
          <PhaseTimeline
            phases={timelinePhases}
            todayLabel={t("today")}
            todayDate={formatMonthDay(today, locale)}
          />
          <AlertCard title={t("alert.title")} items={redFlagItems} />
        </div>
      )}

      <div className="relative mt-4 mb-8 px-5">
        <ReportCard
          label={t("report.label")}
          title={t("report.title")}
          description={t("report.description")}
          onClick={() => navigate("/aftercare/emergency-report")}
        />
      </div>

      <NoticeFooter
        title={t("notice.title")}
        items={t("notice.items", { returnObjects: true }) as string[]}
      />
    </div>
  );
}

export default AftercarePage;
