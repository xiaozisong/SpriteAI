import { useEffect, useRef, useState } from "react";
import { MODEL_OPTIONS, modelLabel } from "../mock/assets";
import type { ModelType } from "../types";

function ModelGlyph({ icon }: { icon: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true as const,
  };

  if (icon === "cube") {
    return (
      <svg {...common}>
        <path
          d="M12 3 20 8v8l-8 5-8-5V8l8-5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (icon === "sprite") {
    return (
      <svg {...common}>
        <rect x="8" y="4" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 11h10v6H7zM9 17v3M15 17v3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (icon === "video") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M16 10l5-3v10l-5-3V10Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (icon === "character") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="M4 16l5-4 4 3 3-2 4 3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: ModelType) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = MODEL_OPTIONS.find((item) => item.id === value) ?? MODEL_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="aw-model-wrap" ref={rootRef}>
      <button
        type="button"
        className="aw-model-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ModelGlyph icon={active.icon} />
        <span>{modelLabel(value)}</span>
        <span aria-hidden="true" style={{ opacity: 0.55 }}>
          ◉
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="aw-model-menu" role="listbox" aria-label="Model selector">
          {MODEL_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className={`aw-model-item${option.id === value ? " is-active" : ""}`}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              <ModelGlyph icon={option.icon} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
