import { assetTone, modelLabel } from "../mock/assets";
import type { GenerationItem, WorkspacePhase } from "../types";

function AssetGlyph({ model }: { model: GenerationItem["model"] }) {
  if (model === "3d-object") {
    return (
      <svg className="aw-preview-svg" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 16 102 40v40L60 104 18 80V40Z" fill="rgba(255,255,255,.82)" />
        <path d="M60 16 102 40 60 64 18 40Z" fill="rgba(255,255,255,.35)" />
        <path d="M60 64v40L18 80V40Z" fill="rgba(0,0,0,.2)" />
      </svg>
    );
  }
  if (model === "sprite" || model === "character") {
    return (
      <svg className="aw-preview-svg" viewBox="0 0 120 120" aria-hidden="true">
        <rect x="40" y="18" width="40" height="30" rx="10" fill="rgba(255,255,255,.88)" />
        <rect x="34" y="50" width="52" height="36" rx="12" fill="rgba(255,255,255,.72)" />
        <rect x="38" y="88" width="16" height="22" rx="5" fill="rgba(255,255,255,.6)" />
        <rect x="66" y="88" width="16" height="22" rx="5" fill="rgba(255,255,255,.6)" />
        <circle cx="52" cy="32" r="3.5" fill="rgba(20,20,30,.6)" />
        <circle cx="68" cy="32" r="3.5" fill="rgba(20,20,30,.6)" />
      </svg>
    );
  }
  if (model === "video") {
    return (
      <svg className="aw-preview-svg" viewBox="0 0 120 120" aria-hidden="true">
        <rect x="18" y="30" width="64" height="60" rx="10" fill="rgba(255,255,255,.78)" />
        <path d="M86 42l20-10v56l-20-10V42Z" fill="rgba(255,255,255,.55)" />
        <path d="M42 50l22 12-22 12V50Z" fill="rgba(20,20,30,.45)" />
      </svg>
    );
  }
  return (
    <svg className="aw-preview-svg" viewBox="0 0 120 120" aria-hidden="true">
      <rect x="16" y="24" width="88" height="72" rx="12" fill="rgba(255,255,255,.2)" />
      <circle cx="42" cy="48" r="8" fill="rgba(255,255,255,.7)" />
      <path d="M20 82l24-20 18 14 14-10 28 16H20Z" fill="rgba(255,255,255,.7)" />
    </svg>
  );
}

const ACTIONS = [
  { id: "regenerate", label: "Regenerate", path: "M4 12a8 8 0 0 1 13.7-5.7M20 12a8 8 0 0 1-13.7 5.7M20 4v5h-5M4 20v-5h5" },
  { id: "variation", label: "Variation", path: "M8 7h12M4 12h16M8 17h12" },
  { id: "edit", label: "Edit", path: "M4 20h4L19 9l-4-4L4 16v4Z" },
  { id: "upscale", label: "Upscale", path: "M4 14V4h10M4 4l16 16M14 20h6v-6" },
  { id: "remove-bg", label: "Remove Background", path: "M4 8h16M8 4v16M16 4v16M4 16h16" },
  { id: "download", label: "Download", path: "M12 4v12M8 12l4 4 4-4M4 20h16" },
] as const;

interface GenerationCanvasProps {
  phase: WorkspacePhase;
  activePrompt: string;
  items: GenerationItem[];
  onAction: (actionId: string) => void;
}

export function GenerationCanvas({
  phase,
  activePrompt,
  items,
  onAction,
}: GenerationCanvasProps) {
  const current = items[items.length - 1];
  const prev = items.length > 1 ? items[items.length - 2] : null;
  const nextVisual = items.length > 2 ? items[items.length - 3] : null;

  if (phase === "idle") return null;

  return (
    <div className="aw-gen-stage">
      <h2 className="aw-prompt-title">{activePrompt}</h2>

      {phase === "generating" ? (
        <div className="aw-loading" aria-live="polite" aria-busy="true">
          <div className="aw-loading-glow" />
          <div className="aw-loading-ring" />
          <div className="aw-loading-card" />
        </div>
      ) : null}

      {phase === "result" && current ? (
        <>
          <div className="aw-stack" aria-live="polite">
            {nextVisual ? (
              <div className="aw-stack-item is-next" key={`${nextVisual.id}-next`}>
                <div className="aw-asset-card">
                  <div
                    className="aw-asset-surface"
                    style={{ background: assetTone(nextVisual.model, nextVisual.assetVariant) }}
                  >
                    <AssetGlyph model={nextVisual.model} />
                  </div>
                </div>
              </div>
            ) : null}

            {prev ? (
              <div className="aw-stack-item is-prev" key={`${prev.id}-prev`}>
                <div className="aw-asset-card">
                  <div
                    className="aw-asset-surface"
                    style={{ background: assetTone(prev.model, prev.assetVariant) }}
                  >
                    <AssetGlyph model={prev.model} />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="aw-stack-item is-current is-enter" key={current.id}>
              <div className="aw-asset-card">
                <div
                  className="aw-asset-surface"
                  style={{ background: assetTone(current.model, current.assetVariant) }}
                >
                  <AssetGlyph model={current.model} />
                  <span className="aw-asset-label">{modelLabel(current.model)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="aw-actions">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className="aw-action-btn"
                aria-label={action.label}
                title={action.label}
                onClick={() => onAction(action.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d={action.path}
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
