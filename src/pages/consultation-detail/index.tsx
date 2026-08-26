import axios from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import ConsultationFooter from "@/components/Footer/ConsultationFooter";
import ConsultationHeader from "@/components/Header/ConsultationHeader";
import LoadingState from "@/components/Loading/LoadingState";
import ConfirmedConsultationInfo from "@/pages/consultation-confirmed/components/ConfirmedConsultationInfo";
import ConsultationCancelSheet from "@/pages/consultation-confirmed/components/ConsultationCancelSheet";
import ConsultationEntryNotice from "@/pages/consultation-confirmed/components/ConsultationEntryNotice";
import { useConsultationReservationStore } from "@/stores/useConsultationReservationStore";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import type { ApiErrorResponse } from "@/types/api.type";
import type { ConsultationCancelReason } from "@/types/consultationReservation.type";
import {
  formatConfirmedDateTime,
  formatConsultationCardDateTime,
} from "@/utils/dateTime";
import { translateConsultationSubject } from "@/utils/consultationSubject";

import { useConsultationAppointmentDetail } from "./hooks/useConsultationAppointmentDetail";
import { useCancelConsultationAppointment } from "@/pages/consultation-confirmed/hooks/useCancelConsultationAppointment";

function ConsultationDetailPage() {
  const { appointmentId: appointmentIdParam } = useParams();
  const appointmentId = Number(appointmentIdParam);
  const navigate = useNavigate();
  const { t } = useTranslation("consultationReservation");
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const locale = usePreferencesStore((state) => state.locale);
  const timeZone = usePreferencesStore((state) => state.timeZone);
  const resetReservation = useConsultationReservationStore(
    (state) => state.reset,
  );
  const {
    data: appointment,
    isPending,
    isError,
    refetch,
  } = useConsultationAppointmentDetail(appointmentId);
  const { mutateAsync: cancelAppointment, isPending: isCancelling } =
    useCancelConsultationAppointment();

  if (!Number.isInteger(appointmentId) || appointmentId < 1) {
    return <Navigate to="/consultation" replace />;
  }

  const handleConfirmCancellation = async (reason: ConsultationCancelReason) => {
    if (isCancelling || !appointment) return;

    setCancelError(null);

    try {
      await cancelAppointment({ appointmentId });
      navigate(`/consultation/${appointmentId}/cancelled`, {
        replace: true,
        state: {
          cancelledAt: new Date().toISOString(),
          cancelReason: reason,
          startsAt: appointment.startsAt,
          symptoms,
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

  if (!isPending && (isError || !appointment)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FCFCFC] px-5 text-center text-sm text-[#65646D]">
        <p>{t("appointmentDetail.notFound")}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-full bg-[#2A2A2A] px-5 py-3 font-semibold text-white"
        >
          {t("appointmentDetail.retry")}
        </button>
      </div>
    );
  }

  const highlightedDate = appointment
    ? formatConfirmedDateTime(appointment.startsAt, {
        locale,
        timeZone,
      })
    : "";
  const detailDate = appointment
    ? formatConsultationCardDateTime(appointment.startsAt, {
        locale,
        timeZone,
      })
    : "";
  const symptoms =
    appointment?.symptomCategories
      .map((category) =>
        translateConsultationSubject(category, (key) =>
          t(`preConsultation.symptoms.options.${key}`),
        ),
      )
      .join("·") || "-";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#FCFCFC] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_18%,rgba(222,219,248,0.78),transparent_48%),radial-gradient(circle_at_18%_72%,rgba(233,230,250,0.68),transparent_42%),radial-gradient(circle_at_88%_78%,rgba(225,222,246,0.52),transparent_38%)]">
      <ConsultationHeader
        title={t("schedule.headerTitle")}
        onBack={() => navigate("/consultation")}
        className="relative z-10 bg-transparent"
      />

      <main className="relative z-10 flex-1 px-5 pt-10.5 pb-[calc(110px+env(safe-area-inset-bottom))]">
        {isPending ? (
          <LoadingState
            variant="section"
            className="min-h-0 h-full"
            message={t("appointmentDetail.loading")}
          />
        ) : (
          <>
            <h1 className="text-2xl font-semibold leading-[1.4] tracking-tight text-[#32303A]">
              {t("appointmentDetail.title")}
            </h1>
            <p className="mt-1.5 text-xl font-semibold leading-[1.4] tracking-tight text-[#614BB8]">
              {highlightedDate}
            </p>

            <div className="mt-6">
              <ConsultationEntryNotice message={t("confirmed.entryNotice")} />
            </div>

            <section className="mt-13">
              <h2 className="text-xl font-semibold leading-[1.4] tracking-tight text-[#32303A]">
                {t("confirmed.infoTitle")}
              </h2>
              <ConfirmedConsultationInfo
                dateLabel={t("confirmed.summary.date")}
                dateValue={detailDate}
                reasonLabel={t("confirmed.summary.reason")}
                reasonValue={symptoms}
                doctorLabel={t("confirmed.summary.doctor")}
                doctorValue={t("confirmed.mockDoctor")}
              />
            </section>
          </>
        )}
      </main>

      {appointment && (
        <>
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
        </>
      )}
    </div>
  );
}

export default ConsultationDetailPage;
