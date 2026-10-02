"use client";

// components/ImageUploader.tsx
//
// Handles the "upload a photo" part of the brief's requirement (3). It
// supports both a traditional file picker (click) and drag-and-drop, shows
// a live preview of the chosen image, and performs lightweight client-side
// validation (file type/size) before the parent component ever tries to
// send the file to the backend.
//
// This component is intentionally "dumb": it only deals with picking a
// file and previewing it. The actual network request lives in lib/api.ts
// and is triggered by the parent (app/page.tsx), which keeps this
// component easy to reuse/test in isolation.

import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB - mirrors the server-side check

interface ImageUploaderProps {
  /** Called with a valid File once the user selects/drops one. */
  onFileSelected: (file: File, previewUrl: string) => void;
  /** Disables interaction while a prediction request is in flight. */
  disabled?: boolean;
  /** Current preview image URL, if any (lifted up to the parent so it can
   * be cleared/reset alongside prediction state). */
  previewUrl: string | null;
}

export default function ImageUploader({
  onFileSelected,
  disabled,
  previewUrl,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndEmit = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        setValidationError("Please choose a JPEG, PNG, or WEBP image.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setValidationError("That image is too large - please pick one under 8 MB.");
        return;
      }

      setValidationError(null);
      // Create a temporary local URL so we can preview the image
      // immediately, without waiting for any network round-trip.
      const previewUrl = URL.createObjectURL(file);
      onFileSelected(file, previewUrl);
    },
    [onFileSelected]
  );

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    validateAndEmit(e.target.files?.[0]);
    // Reset the input value so selecting the *same* file again still fires
    // a change event (otherwise browsers won't re-trigger onChange).
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    validateAndEmit(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload a photo of a fruit"
        className={[
          "flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-white hover:border-brand-500 hover:bg-brand-50",
        ].join(" ")}
      >
        {previewUrl ? (
          // Plain <img> is used (not next/image) because this is a
          // transient, client-generated blob URL rather than a static or
          // remote asset - next/image's optimiser doesn't apply here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected fruit preview"
            className="max-h-56 rounded-xl object-contain shadow-sm"
          />
        ) : (
          <>
            <span className="text-4xl">📷</span>
            <p className="font-medium text-slate-700">
              Click to choose a photo, or drag one in here
            </p>
            <p className="text-sm text-slate-500">
              An apple or a banana &middot; JPEG, PNG, or WEBP &middot; up to 8 MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {validationError && (
        <p className="mt-2 text-sm font-medium text-red-600">{validationError}</p>
      )}
    </div>
  );
}
