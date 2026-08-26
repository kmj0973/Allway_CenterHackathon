import { useRef, useState, type ChangeEvent } from "react";

import camera from "@/assets/home/camera.svg";
import image from "@/assets/home/image.svg";

interface AttachButtonProps {
  attachLabel: string;
  cameraLabel: string;
  photoLabel: string;
  onImageSelect: (file: File) => void;
}

function AttachButton({
  attachLabel,
  cameraLabel,
  photoLabel,
  onImageSelect,
}: AttachButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImageSelect(file);
    event.target.value = "";
  };

  return (
    <div className="relative shrink-0">
      {isMenuOpen && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />

          <div className="bg-neutral-white/90 absolute bottom-full left-0 z-20 mb-3 flex w-60.75 flex-col rounded-[30px] py-2.5 shadow-[0_0_5.3px_0_rgba(0,0,0,0.15)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                cameraInputRef.current?.click();
              }}
              className="flex h-15.75 items-center gap-4 px-5"
            >
              <span className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-[rgba(101,100,109,0.14)]">
                <img aria-hidden src={camera} alt="" className="size-6" />
              </span>
              <span className="text-text-01 text-[1.25rem] leading-[1.4] tracking-tight whitespace-nowrap">
                {cameraLabel}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                photoInputRef.current?.click();
              }}
              className="flex h-15.75 items-center gap-4 px-5"
            >
              <span className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-[rgba(101,100,109,0.14)]">
                <img aria-hidden src={image} alt="" className="size-6" />
              </span>
              <span className="text-text-01 text-[1.25rem] leading-[1.4] tracking-tight whitespace-nowrap">
                {photoLabel}
              </span>
            </button>
          </div>
        </>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        aria-label={attachLabel}
        onClick={() => setIsMenuOpen((open) => !open)}
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
      >
        <span aria-hidden className="relative block size-3.5">
          <span className="bg-text-03 absolute top-1/2 left-0 h-[1.5px] w-full -translate-y-1/2 rounded-lg" />
          <span className="bg-text-03 absolute top-0 left-1/2 h-full w-[1.5px] -translate-x-1/2 rounded-lg" />
        </span>
      </button>
    </div>
  );
}

export default AttachButton;
