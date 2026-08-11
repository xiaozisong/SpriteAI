import { useRef } from "react";
import { ModelSelector } from "./ModelSelector";
import type { ModelType } from "../types";

interface PromptComposerProps {
  value: string;
  model: ModelType;
  isGenerating: boolean;
  referencePreviewUrl?: string | null;
  onChange: (value: string) => void;
  onModelChange: (model: ModelType) => void;
  onSubmit: () => void;
  onUpload: (file: File) => void;
  onClearReference?: () => void;
}

export function PromptComposer({
  value,
  model,
  isGenerating,
  referencePreviewUrl,
  onChange,
  onModelChange,
  onSubmit,
  onUpload,
  onClearReference,
}: PromptComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 && !isGenerating;

  return (
    <div className="aw-composer-shell">
      <ModelSelector value={model} onChange={onModelChange} />

      <div className="aw-composer">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Describe what you want to create..."
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) onSubmit();
            }
          }}
        />

        <div className="aw-composer-toolbar">
          <div className="aw-composer-left">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              className="aw-icon-btn"
              aria-label="Upload reference image"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 16V4M8 8l4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {referencePreviewUrl ? (
              <button
                type="button"
                className="aw-ref-thumb"
                aria-label="Clear reference image"
                onClick={onClearReference}
              >
                <img src={referencePreviewUrl} alt="" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className={`aw-send-btn${canSend ? " is-ready" : ""}${isGenerating ? " is-loading" : ""}`}
            aria-label="Send prompt"
            disabled={!canSend}
            onClick={onSubmit}
          >
            {isGenerating ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="30 20"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h12M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
