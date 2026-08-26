import { useCallback, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getAftercareHome } from "@/apis/aftercare.api";
import ConsultationFooter from "@/components/Footer/ConsultationFooter";
import { useConsultationReservationStore } from "@/stores/useConsultationReservationStore";
import type { ApiErrorResponse } from "@/types/api.type";
import type {
  SymptomCategory,
  SymptomType,
} from "@/types/consultationReservation.type";
import { cn } from "@/utils/cn";

import NoticeCardSection from "./components/NoticeCardSection";
import PhotoUploadSection from "./components/PhotoUploadSection";
import ReservationConfirmSheet from "./components/ReservationConfirmSheet";
import SubTitleSection from "./components/SubTitleSection";
import SymptomSection from "./components/SymptomSection";
import { useCreateConsultationAppointment } from "./hooks/useCreateConsultationAppointment";

const SYMPTOM_CATEGORY_BY_TYPE: Record<SymptomType, SymptomCategory> = {
  pain: "PAIN",
  swelling: "SWELLING",
  redness: "REDNESS",
  heat: "HEAT",
  bleeding: "BLEEDING",
  itching: "ITCHING",
  bruise: "BRUISING",
  other: "OTHER",
};

function PreConsultationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("consultationReservation");
  const [isConfirmSheetOpen, setIsConfirmSheetOpen] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const { data: aftercareHome, isPending: isAftercareHomePending } = useQuery({
    queryKey: ["aftercare", "home"],
    queryFn: getAftercareHome,
  });
  const { mutateAsync: createAppointment, isPending: isSubmitting } =
    useCreateConsultationAppointment();
  const {
    selectedSymptoms,
    selectedSlot,
    symptomDescription,
    imageFiles,
    toggleSymptom,
    setSymptomDescription,
    setImageFiles,
  } = useConsultationReservationStore();

  const canSubmit =
    selectedSymptoms.length > 0 ||
    symptomDescription.trim().length > 0 ||
    imageFiles.length > 0;

  const noticeMarginClass = cn(
    symptomDescription.trim().length > 0
      ? imageFiles.length > 0
        ? "mt-[163px]"
        : "mt-[121px]"
      : imageFiles.length > 0
        ? "mt-[142px]"
        : "mt-[100px]",
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitErrorMessage(null);
    setIsConfirmSheetOpen(true);
  };

  const handleCloseConfirmSheet = useCallback(() => {
    setIsConfirmSheetOpen(false);
    setHasAgreed(false);
    setSubmitErrorMessage(null);
  }, []);

  const handleConfirmReservation = async () => {
    if (!hasAgreed || !selectedSlot || isSubmitting) return;

    setSubmitErrorMessage(null);

    if (!aftercareHome?.caseId) {
      setSubmitErrorMessage(
        "사후관리 케이스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    try {
      const appointment = await createAppointment({
        caseId: aftercareHome.caseId,
        slotId: selectedSlot.slotId,
        symptomCategories: selectedSymptoms.map(
          (symptom) => SYMPTOM_CATEGORY_BY_TYPE[symptom],
        ),
        symptomNote: symptomDescription,
        files: imageFiles.map(({ file }) => file),
      });

      handleCloseConfirmSheet();
      navigate(`/consultation/${appointment.appointmentId}/confirmed`, {
        replace: true,
      });
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data.message
        : null;
      setSubmitErrorMessage(
        message ?? "예약을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  };

  return (
    <>
      <main className="relative z-10 flex-1 bg-transparent px-5 pb-[calc(110px+env(safe-area-inset-bottom))] pt-6">
        <SubTitleSection />
        <SymptomSection
          selectedSymptoms={selectedSymptoms}
          description={symptomDescription}
          onToggleSymptom={toggleSymptom}
          onChangeDescription={setSymptomDescription}
        />
        <PhotoUploadSection files={imageFiles} onChange={setImageFiles} />
        <NoticeCardSection className={noticeMarginClass} />
      </main>

      <ConsultationFooter
        disabled={!canSubmit || isAftercareHomePending || !aftercareHome?.caseId}
        onClick={handleSubmit}
        className="bg-transparent bg-gradient-to-b from-white/0 to-white/60 backdrop-blur-[4.7px]"
        buttonClassName="disabled:bg-[#FDFDFF] disabled:text-[#9795A0]"
      >
        {t("preConsultation.submit")}
      </ConsultationFooter>

      <ReservationConfirmSheet
        open={isConfirmSheetOpen}
        selectedSlot={selectedSlot}
        selectedSymptoms={selectedSymptoms}
        agreed={hasAgreed}
        onAgreeChange={setHasAgreed}
        onClose={handleCloseConfirmSheet}
        onConfirm={handleConfirmReservation}
        isSubmitting={isSubmitting}
        errorMessage={submitErrorMessage}
      />
    </>
  );
}

export default PreConsultationPage;
