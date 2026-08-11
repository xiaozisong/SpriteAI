import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  selectAvatarDataUrl,
  selectUserInfo,
  useLoginStore,
} from "@/stores/loginStore";
import { AccountChrome } from "./components/AccountChrome";
import { GenerationCanvas } from "./components/GenerationCanvas";
import { IconSidebar } from "./components/IconSidebar";
import { PromptComposer } from "./components/PromptComposer";
import { QuickStartCards } from "./components/QuickStartCards";
import { SuggestionChips } from "./components/SuggestionChips";
import { WelcomeHero } from "./components/WelcomeHero";
import {
  CREDITS_TOTAL,
  MOCK_GENERATE_MS,
  projectNameFromPrompt,
} from "./mock/assets";
import type {
  GenerationItem,
  ModelType,
  QuickStartCard,
  SidebarNavId,
  WorkspacePhase,
} from "./types";
import "./ai-workspace.css";

function chipToPrompt(chip: string, model: ModelType): string {
  const map: Record<string, string> = {
    Cube: "Create a 3D model of a cube with soft studio lighting",
    Sword: "Create a stylized fantasy sword game asset",
    Character: "Create a cyberpunk game character portrait",
    Environment: "Create a foggy cinematic game environment",
    "Pixel Art": "Create a pixel art knight character sprite",
  };
  if (model === "sprite" && chip === "Character") {
    return "Create a pixel art knight character sprite for a 2D RPG";
  }
  return map[chip] ?? `Create a ${chip.toLowerCase()} game asset`;
}

export default function AiWorkspacePage() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const userInfo = useLoginStore(selectUserInfo);
  const avatarUrl = useLoginStore(selectAvatarDataUrl);

  const [activeNav, setActiveNav] = useState<SidebarNavId>("create");
  const [phase, setPhase] = useState<WorkspacePhase>("idle");
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [model, setModel] = useState<ModelType>("image");
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const generateTimerRef = useRef<number | null>(null);
  const variantRef = useRef(0);

  useEffect(() => {
    return () => {
      if (generateTimerRef.current != null) {
        window.clearTimeout(generateTimerRef.current);
      }
      if (referenceUrl) URL.revokeObjectURL(referenceUrl);
    };
  }, [referenceUrl]);

  const projectName = useMemo(() => {
    if (items.length === 0) return "";
    return projectNameFromPrompt(items[0]?.prompt ?? activePrompt);
  }, [items, activePrompt]);

  const displayName = useMemo(() => {
    if (userInfo?.nickName) return userInfo.nickName;
    return "Your account";
  }, [userInfo]);

  const runGeneration = useCallback(
    (nextPrompt: string, nextModel: ModelType) => {
      const trimmed = nextPrompt.trim();
      if (!trimmed) return;
      if (creditsUsed >= CREDITS_TOTAL) {
        toast.message("Credits used up for this mock session");
        return;
      }

      if (generateTimerRef.current != null) {
        window.clearTimeout(generateTimerRef.current);
      }

      setActivePrompt(trimmed);
      setPhase("generating");
      setPrompt("");

      generateTimerRef.current = window.setTimeout(() => {
        variantRef.current += 1;
        const item: GenerationItem = {
          id: `gen-${Date.now()}-${variantRef.current}`,
          prompt: trimmed,
          model: nextModel,
          createdAt: Date.now(),
          assetVariant: variantRef.current,
        };
        setItems((prev) => [...prev, item]);
        setCreditsUsed((prev) => Math.min(CREDITS_TOTAL, prev + 1));
        setPhase("result");
        generateTimerRef.current = null;
      }, MOCK_GENERATE_MS);
    },
    [creditsUsed]
  );

  const handleSubmit = useCallback(() => {
    runGeneration(prompt, model);
  }, [model, prompt, runGeneration]);

  const handleQuickStart = useCallback(
    (card: QuickStartCard) => {
      setModel(card.model);
      setPrompt(card.prompt);
      runGeneration(card.prompt, card.model);
    },
    [runGeneration]
  );

  const handleChip = useCallback(
    (chip: string) => {
      const next = chipToPrompt(chip, model);
      setPrompt(next);
    },
    [model]
  );

  const handleNav = useCallback(
    (id: SidebarNavId) => {
      if (id === "create") {
        setActiveNav("create");
        return;
      }
      if (id === "home") {
        navigate("/");
        return;
      }
      if (id === "profile") {
        toast.message("Account panel coming soon");
        return;
      }
      toast.message("即将开放");
      setActiveNav("create");
    },
    [navigate]
  );

  const handleAction = useCallback(
    (actionId: string) => {
      if (!activePrompt) return;
      if (actionId === "regenerate" || actionId === "variation") {
        const suffix =
          actionId === "variation" ? " Make a subtle visual variation." : "";
        runGeneration(`${activePrompt}${suffix}`, model);
        return;
      }
      if (actionId === "edit") {
        setPrompt(`Refine this: ${activePrompt}`);
        return;
      }
      toast.message(`${actionId} is mock-only for now`);
    },
    [activePrompt, model, runGeneration]
  );

  const handleUpload = useCallback(
    (file: File) => {
      if (referenceUrl) URL.revokeObjectURL(referenceUrl);
      setReferenceUrl(URL.createObjectURL(file));
      toast.message("Reference image attached (local mock)");
    },
    [referenceUrl]
  );

  return (
    <div className="aw-root" data-work-id={workId ?? ""}>
      <div className="aw-ambient" aria-hidden="true" />
      <div className="aw-noise" aria-hidden="true" />

      <IconSidebar activeId={activeNav} onNavigate={handleNav} />

      <div className="aw-main">
        <AccountChrome
          creditsUsed={creditsUsed}
          displayName={displayName}
          avatarUrl={avatarUrl}
          onAccountClick={() => toast.message("Account panel coming soon")}
        />

        {projectName ? (
          <div className="aw-project-chip">
            <span className="aw-project-icon" aria-hidden="true">
              AI
            </span>
            <span>{projectName}</span>
          </div>
        ) : null}

        <div className="aw-canvas">
          {phase === "idle" ? (
            <>
              <WelcomeHero />
              <QuickStartCards onSelect={handleQuickStart} />
            </>
          ) : (
            <GenerationCanvas
              phase={phase}
              activePrompt={activePrompt}
              items={items}
              onAction={handleAction}
            />
          )}
        </div>

        <div className="aw-composer-dock">
          {phase !== "generating" ? (
            <SuggestionChips onSelect={handleChip} />
          ) : null}
          <PromptComposer
            value={prompt}
            model={model}
            isGenerating={phase === "generating"}
            referencePreviewUrl={referenceUrl}
            onChange={setPrompt}
            onModelChange={setModel}
            onSubmit={handleSubmit}
            onUpload={handleUpload}
            onClearReference={() => {
              if (referenceUrl) URL.revokeObjectURL(referenceUrl);
              setReferenceUrl(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
