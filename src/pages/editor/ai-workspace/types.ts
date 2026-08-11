export type WorkspacePhase = "idle" | "generating" | "result";

export type ModelType =
  | "image"
  | "sprite"
  | "3d-object"
  | "video"
  | "character";

export type SidebarNavId =
  | "home"
  | "create"
  | "library"
  | "assets"
  | "community"
  | "settings"
  | "help"
  | "profile";

export interface GenerationItem {
  id: string;
  prompt: string;
  model: ModelType;
  createdAt: number;
  assetVariant: number;
}

export interface QuickStartCard {
  id: string;
  titleLine1: string;
  titleLine2: string;
  model: ModelType;
  prompt: string;
  gradientClass: string;
  previewKind: "cube" | "sprite" | "environment";
}
