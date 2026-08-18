import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getAftercareHome } from "@/apis/patient";
import ConsultationFooter from "@/components/Footer/ConsultationFooter";
import ConsultationHeader from "@/components/Header/ConsultationHeader";
import type { Consultation } from "./components/ConsultationCard";
import ConsultationGuide from "./components/ConsultationGuide";
import ConsultationHistoryList from "./components/ConsultationHistoryList";
import ConsultationReservationList from "./components/ConsultationReservationList";
import ConsultationTabs from "./components/ConsultationTabs";
import { useActiveConsultationAppointment } from "./hooks/useActiveConsultationAppointment";
import { useConsultationHistory } from "./hooks/useConsultationHistory";
import { useConsultationSummaries } from "@/pages/consultation-summary/hooks/useConsultationSummaries";
import { toSummaryRequestLanguage } from "@/pages/consultation-summary/utils/consultationSummary";
import { usePreferencesStore } from "@/stores/usePreferencesStore";

type ConsultationTab = "history" | "ongoing";

const mockMedicalStaff = {
  medicalStaffName: "박지태",
  medicalStaffRole: "doctor" as const,
};

function ConsultationHubPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("consultationHub");
  const locale = usePreferencesStore((state) => state.locale);
  const summaryLanguage = toSummaryRequestLanguage(locale);
  const [activeTab, setActiveTab] = useState<ConsultationTab>("history");
  const { data: aftercareHome } = useQuery({
    queryKey: ["aftercare", "home"],
    queryFn: getAftercareHome,
  });
  const {
    data: activeAppointments = [],
    isPending: isAppointmentPending,
    isError: isAppointmentError,
    refetch: refetchAppointment,
  } = useActiveConsultationAppointment(aftercareHome?.caseId ?? null);
  const {
    data: consultationHistoryData = [],
    isPending: isHistoryPending,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useConsultationHistory();
  const { data: consultationSummaries = [] } =
    useConsultationSummaries(summaryLanguage);

  const summaryIdBySessionId = useMemo(
    () =>
      new Map(
        consultationSummaries.map((summary) => [
          summary.sessionId,
          summary.summaryId,
        ]),
      ),
    [consultationSummaries],
  );

  const ongoingConsultations = useMemo<Consultation[]>(
    () =>
      activeAppointments.map((appointment) => ({
        id: appointment.appointmentId,
        status: "reserved",
        scheduledAt: appointment.startsAt,
        subject:
          (
            appointment.symptomCategories ??
            (appointment.symptomCategory
              ? [appointment.symptomCategory]
              : [])
          ).join(" · ") || "-",
        symptomNote: appointment.symptomNote,
        ...mockMedicalStaff,
      })),
    [activeAppointments],
  );
  const historyConsultations = useMemo<Consultation[]>(
    () =>
      consultationHistoryData.map((history) => ({
        id: history.appointmentId,
        summaryId: history.sessionId
          ? summaryIdBySessionId.get(history.sessionId)
          : undefined,
        status: history.status === "CANCELLED" ? "cancelled" : "completed",
        scheduledAt: history.appointmentStartsAt,
        subject:
          (
            history.symptomCategories?.length
              ? history.symptomCategories
              : history.symptomCategory
                ? [history.symptomCategory]
                : []
          ).join(" · ") || null,
        symptomNote: history.symptomNote,
        ...mockMedicalStaff,
      })),
    [consultationHistoryData, summaryIdBySessionId],
  );

  const enterableAppointment = activeAppointments.find(
    (appointment) => appointment.canEnterWaitingRoom,
  );

  const handleEnterWaitingRoom = () => {
    if (!enterableAppointment) return;
    navigate(
      `/consultation/${enterableAppointment.appointmentId}/waiting?role=PATIENT`,
    );
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#FAFAFA] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_18%,rgba(222,219,248,0.78),transparent_48%),radial-gradient(circle_at_18%_72%,rgba(233,230,250,0.68),transparent_42%),radial-gradient(circle_at_88%_78%,rgba(225,222,246,0.52),transparent_38%)]">
      <ConsultationHeader
        title={t("header.title")}
        onBack={() => navigate("/home")}
        className="relative z-10 bg-transparent"
      />

      <main className="relative z-10 flex flex-1 flex-col pb-[calc(90px+env(safe-area-inset-bottom))]">
        <section className="flex flex-1 flex-col">
          <ConsultationTabs
            activeTab={activeTab}
            ongoingCount={ongoingConsultations.length}
            onChange={setActiveTab}
          />

          {activeTab === "history" ? (
            <ConsultationHistoryList
              consultations={historyConsultations}
              isLoading={isHistoryPending}
              isError={isHistoryError}
              onRetry={() => void refetchHistory()}
              onSelect={(summaryId) =>
                navigate(`/consultation/summary/${summaryId}`)
              }
            />
          ) : (
            <ConsultationReservationList
              consultations={ongoingConsultations}
              isLoading={isAppointmentPending}
              isError={isAppointmentError}
              onRetry={() => void refetchAppointment()}
              onSelect={(appointmentId) =>
                navigate(`/consultation/${appointmentId}/details`)
              }
            />
          )}
        </section>
        <section className="mt-auto bg-black/[0.03] px-5 py-[26px]">
          <ConsultationGuide />
        </section>
      </main>

      <ConsultationFooter
        disabled={activeTab !== "ongoing" || !enterableAppointment}
        onClick={handleEnterWaitingRoom}
        className="bg-transparent bg-gradient-to-b from-white/0 to-white/45 pt-[14px] backdrop-blur-[4.7px]"
        buttonClassName="disabled:bg-[#FDFDFF] disabled:text-[#9795A0]"
      >
        {t("footer.enter")}
      </ConsultationFooter>
    </div>
  );
}

export default ConsultationHubPage;
