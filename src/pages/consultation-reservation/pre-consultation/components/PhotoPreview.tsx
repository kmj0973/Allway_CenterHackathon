import type { ConsultationAttachment } from "@/types/consultationReservation.type";
import { useTranslation } from "react-i18next";
import xIcon from "@/assets/icons/consultation/x.svg";

interface PhotoPreviewProps {
  attachment: ConsultationAttachment;
  onRemove: () => void;
}

function PhotoPreview({ attachment, onRemove }: PhotoPreviewProps) {
  const { t } = useTranslation("consultationReservation");
  const { file, previewUrl } = attachment;
  const isVideo = file.type === "video/mp4";

  return (
    <div className="relative size-[110px] shrink-0 overflow-hidden rounded-[14px] border border-calendar-control-border">
      {isVideo ? (
        <video
          src={previewUrl}
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={previewUrl}
          alt={file.name}
          className="size-full object-cover"
        />
      )}

      <button
        type="button"
        aria-label={t("preConsultation.photos.remove", { name: file.name })}
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full  text-lg leading-none"
      >
        <img src={xIcon} alt="이미지 제거" />
      </button>
    </div>
  );
}

export default PhotoPreview;
