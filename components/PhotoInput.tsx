"use client";

import { ImageUp } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";

type PhotoInputProps = {
  onSelect: (file: File) => void;
  error?: string;
};

export function PhotoInput({ onSelect, error }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  const errorId = useId();

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onSelect(file);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-4 rounded-md border px-6 py-12 text-center transition-colors ${
          dragging ? "border-accent bg-white" : "border-dashed border-line"
        }`}
      >
        <ImageUp aria-hidden className="size-6 text-muted" strokeWidth={1.5} />
        <p className="text-muted">Drag a photo here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className="rounded-sm bg-accent px-4 py-2 font-medium text-paper hover:bg-accent/90"
        >
          Choose a photo
        </button>
        <p id={hintId} className="text-sm text-muted">
          JPEG, PNG or WebP. On a phone this opens the camera.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onSelect(file);
          }}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
