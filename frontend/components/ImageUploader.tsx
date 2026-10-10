"use client";

// components/ImageUploader.tsx
//
// This component is the "upload a photo" box. It lets the user either
// click to pick a file, or drag and drop one in, shows a preview of the
// chosen photo, and checks the file type/size before handing it back to
// the parent page.
//
// This component doesn't send anything over the network itself - it just
// picks the file and hands it to the parent (app/page.tsx), which decides
// what to do with it. That keeps this component simple and easy to test
// on its own.

import { ChangeEvent, DragEvent, useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB - same limit the server checks too

interface ImageUploaderProps {
  /** This runs with the chosen file once the user picks/drops a valid one. */
  onFileSelected: (file: File, previewUrl: string) => void;
  /** Set to true to stop the user from picking a new file (e.g. while loading). */
  disabled?: boolean;
  /** The preview image to show, if one has been picked already. This is
   * passed down from the parent so it can be cleared together with the
   * rest of the page's state when the user hits Reset. */
  previewUrl: string | null;
}

export default function ImageUploader({
  onFileSelected,
  disabled,
  previewUrl,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // isDragging is true while the user is dragging a file over the box.
  const [isDragging, setIsDragging] = useState(false);
  // validationError holds a message if the chosen file isn't allowed.
  const [validationError, setValidationError] = useState<string | null>(null);

  // This checks that the file is a type/size we accept, and if so, hands
  // it (plus a local preview URL) up to the parent component.
  function validateAndEmit(file: File | undefined | null) {
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
    const previewUrl = URL.createObjectURL(file);
    onFileSelected(file, previewUrl);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    validateAndEmit(e.target.files?.[0]);
    // We clear the input's value here so that choosing the exact same
    // file again still triggers this function (browsers skip onChange if
    // the value hasn't changed otherwise).
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
            ? "cursor-not-allowed border-ink-200 bg-cream-200 opacity-60"
            : isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-ink-300 bg-cream-50 hover:border-brand-500 hover:bg-brand-50",
        ].join(" ")}
      >
        {previewUrl ? (
          // We use a plain <img> here instead of next/image because this
          // is just a temporary blob URL from the user's own browser, not
          // a real image file next/image could optimise.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected fruit preview"
            className="max-h-56 rounded-xl object-contain shadow-sm"
          />
        ) : (
          <>
            <span className="text-4xl">📷</span>
            <p className="font-medium text-ink-700">
              Click to choose a photo, or drag one in here
            </p>
            <p className="text-sm text-ink-500">
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
        <p className="mt-2 text-sm font-medium text-apple-600">{validationError}</p>
      )}
    </div>
  );
}
