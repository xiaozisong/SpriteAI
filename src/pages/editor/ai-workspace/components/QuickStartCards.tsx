import { QUICK_START_CARDS } from "../mock/assets";
import type { QuickStartCard } from "../types";

function PreviewArt({ kind }: { kind: QuickStartCard["previewKind"] }) {
  if (kind === "cube") {
    return (
      <svg className="aw-quick-preview" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="awCube" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,.35)" />
          </linearGradient>
        </defs>
        <path d="M60 18 98 40v40L60 102 22 80V40Z" fill="url(#awCube)" opacity="0.9" />
        <path d="M60 18 98 40 60 62 22 40Z" fill="rgba(255,255,255,.35)" />
        <path d="M60 62v40L22 80V40Z" fill="rgba(0,0,0,.18)" />
      </svg>
    );
  }

  if (kind === "sprite") {
    return (
      <svg className="aw-quick-preview" viewBox="0 0 120 120" aria-hidden="true">
        <rect x="42" y="22" width="36" height="28" rx="8" fill="rgba(255,255,255,.85)" />
        <rect x="36" y="50" width="48" height="34" rx="10" fill="rgba(255,255,255,.7)" />
        <rect x="40" y="84" width="14" height="22" rx="4" fill="rgba(255,255,255,.55)" />
        <rect x="66" y="84" width="14" height="22" rx="4" fill="rgba(255,255,255,.55)" />
        <circle cx="52" cy="34" r="3" fill="rgba(20,20,30,.55)" />
        <circle cx="68" cy="34" r="3" fill="rgba(20,20,30,.55)" />
      </svg>
    );
  }

  return (
    <svg className="aw-quick-preview" viewBox="0 0 120 120" aria-hidden="true">
      <path
        d="M10 78c18-22 34-18 48-8 14 10 28 8 42-10 4 18 8 28 10 40H8c2-8 2-16 2-22Z"
        fill="rgba(255,255,255,.55)"
      />
      <path
        d="M18 56c10-16 22-20 34-10 8 7 16 4 24-4 2 12 4 22 6 34H22c0-8-2-14-4-20Z"
        fill="rgba(255,255,255,.35)"
      />
      <circle cx="86" cy="28" r="10" fill="rgba(255,255,255,.5)" />
    </svg>
  );
}

interface QuickStartCardsProps {
  onSelect: (card: QuickStartCard) => void;
}

export function QuickStartCards({ onSelect }: QuickStartCardsProps) {
  return (
    <div className="aw-quick-grid">
      {QUICK_START_CARDS.map((card) => (
        <button
          key={card.id}
          type="button"
          className={`aw-quick-card ${card.gradientClass}`}
          onClick={() => onSelect(card)}
        >
          <span className="aw-quick-copy">
            <span>{card.titleLine1}</span>
            <strong>{card.titleLine2}</strong>
          </span>
          <PreviewArt kind={card.previewKind} />
        </button>
      ))}
    </div>
  );
}
