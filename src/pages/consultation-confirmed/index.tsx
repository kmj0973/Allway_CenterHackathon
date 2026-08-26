import axios from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import ConsultationFooter from "@/components/Footer/ConsultationFooter";
import ConsultationHeader from "@/components/Header/ConsultationHeader";
import { useConsultationReservationStore } from "@/stores/useConsultationReservationStore";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import type { ApiErrorResponse } from "@/types/api.type";
import type { ConsultationCancelReason } from "@/types/consultationReservation.type";
import {
  formatConfirmedDateTime,
  formatConsultationCardDateTime,
} from "@/utils/dateTime";

import ConfirmedConsultationInfo from "./components/ConfirmedConsultationInfo";
import ConsultationCancelSheet from "./components/ConsultationCancelSheet";
import ConsultationEntryNotice from "./components/ConsultationEntryNotice";
import { useCancelConsultationAppointment } from "./hooks/useCancelConsultationAppointment";

function ConsultationConfirmedPage() {
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const { appointmentId: appointmentIdParam } = useParams();
  const appointmentId = Number(appointmentIdParam);
  const navigate = useNavigate();
  const { t } = useTranslation("consultationReservation");
  const locale = usePreferencesStore((state) => state.locale);
  const timeZone = usePreferencesStore((state) => state.timeZone);
  const selectedSlot = useConsultationReservationStore(
    (state) => state.selectedSlot,
  );
  const selectedSymptoms = useConsultationReservationStore(
    (state) => state.selectedSymptoms,
  );
  const resetReservation = useConsultationReservationStore(
    (state) => state.reset,
  );
  const { mutateAsync: cancelAppointment, isPending: isCancelling } =
    useCancelConsultationAppointment();

  if (!selectedSlot) {
    return isLeaving ? null : (
      <Navigate to="/consultation/reservation/schedule" replace />
    );
  }

  const scheduledAt = formatConfirmedDateTime(selectedSlot.startsAt, {
    locale,
    timeZone,
  });
  const scheduledAtDetail = formatConsultationCardDateTime(
    selectedSlot.startsAt,
    { locale, timeZone },
  );
  const symptoms = selectedSymptoms
    .map((symptom) => t(`preConsultation.symptoms.options.${symptom}`))
    .join("·");

  const handleConfirmCancellation = async (
    reason: ConsultationCancelReason,
  ) => {
    if (isCancelling || !Number.isInteger(appointmentId) || appointmentId < 1)
      return;

    setCancelError(null);

    try {
      await cancelAppointment({ appointmentId });
      navigate(`/consultation/${appointmentId}/cancelled`, {
        replace: true,
        state: {
          cancelledAt: new Date().toISOString(),
          cancelReason: reason,
          startsAt: selectedSlot.startsAt,
          symptoms: symptoms || "-",
          doctor: t("confirmed.mockDoctor"),
        },
      });
      resetReservation();
    } catch (error) {
      setCancelError(
        (axios.isAxiosError<ApiErrorResponse>(error) &&
          error.response?.data.message) ||
          t("confirmed.cancelSheet.error", {
            defaultValue:
              "예약을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.",
          }),
      );
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#FCFCFC] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_18%,rgba(222,219,248,0.78),transparent_48%),radial-gradient(circle_at_18%_72%,rgba(233,230,250,0.68),transparent_42%),radial-gradient(circle_at_88%_78%,rgba(225,222,246,0.52),transparent_38%)]">
      <ConsultationHeader
        title={t("schedule.headerTitle")}
        onBack={() => {
          setIsLeaving(true);
          resetReservation();
          navigate("/consultation");
        }}
        className="z-10 bg-transparent"
      />

      <main className="relative z-10 flex-1 px-5 pb-[calc(110px+env(safe-area-inset-bottom))] pt-10.5">
        <h1 className="text-calendar-text text-2xl font-semibold leading-[1.4] tracking-tight">
          {t("confirmed.title")}
        </h1>
        <p className="mt-1.5 text-xl font-semibold leading-[1.4] tracking-tight text-primary">
          {scheduledAt}
        </p>

        <div className="mt-6">
          <ConsultationEntryNotice message={t("confirmed.entryNotice")} />
        </div>

        <section className="mt-13">
          <h2 className="text-calendar-text text-xl font-semibold leading-[1.4] tracking-tight">
            {t("confirmed.infoTitle")}
          </h2>
          <ConfirmedConsultationInfo
            dateLabel={t("confirmed.summary.date")}
            dateValue={scheduledAtDetail}
            reasonLabel={t("confirmed.summary.reason")}
            reasonValue={symptoms || "-"}
            doctorLabel={t("confirmed.summary.doctor")}
            doctorValue={t("confirmed.mockDoctor")}
          />
        </section>
      </main>

      <ConsultationFooter
        variant="danger"
        onClick={() => setIsCancelSheetOpen(true)}
        className="bg-transparent bg-gradient-to-b from-white/0 to-white/60 backdrop-blur-[4.7px]"
      >
        {t("confirmed.cancel")}
      </ConsultationFooter>

      <ConsultationCancelSheet
        open={isCancelSheetOpen}
        onClose={() => setIsCancelSheetOpen(false)}
        onConfirm={handleConfirmCancellation}
        isSubmitting={isCancelling}
        errorMessage={cancelError}
      />
    </div>
  );
}

export default ConsultationConfirmedPage;
