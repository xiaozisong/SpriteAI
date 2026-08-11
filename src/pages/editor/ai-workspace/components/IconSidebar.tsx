import LOGO from "@/assets/images/logo.webp";
import type { SidebarNavId } from "../types";

const MAIN_NAV: Array<{ id: SidebarNavId; label: string; path: string }> = [
  { id: "home", label: "Home", path: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-9.5Z" },
  {
    id: "create",
    label: "Create",
    path: "M12 5v14M5 12h14",
  },
  {
    id: "library",
    label: "Library",
    path: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V6.5A2.5 2.5 0 0 1 6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5Z",
  },
  {
    id: "assets",
    label: "Assets",
    path: "M4 7h16v12H4V7Zm4-3h8v3H8V4Z",
  },
  {
    id: "community",
    label: "Community",
    path: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 19a4.5 4.5 0 0 1 9 0M14 16.5a4.5 4.5 0 0 1 5.5 2.5",
  },
];

const BOTTOM_NAV: Array<{ id: SidebarNavId; label: string; path: string }> = [
  {
    id: "settings",
    label: "Settings",
    path: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.5.9Z",
  },
  {
    id: "help",
    label: "Help",
    path: "M9.1 9a3 3 0 1 1 4.7 2.5c-.8.5-1.3 1-1.3 2v.5M12 18h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  },
  {
    id: "profile",
    label: "Profile",
    path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z",
  },
];

function NavIcon({ d, strokeWidth = 1.6 }: { d: string; strokeWidth?: number }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface IconSidebarProps {
  activeId: SidebarNavId;
  onNavigate: (id: SidebarNavId) => void;
}

export function IconSidebar({ activeId, onNavigate }: IconSidebarProps) {
  return (
    <aside className="aw-sidebar" aria-label="Workspace navigation">
      <button
        type="button"
        className="aw-logo-btn"
        aria-label="精灵"
        onClick={() => onNavigate("create")}
      >
        <img src={LOGO} alt="" />
      </button>

      <nav className="aw-nav-stack" aria-label="Primary">
        {MAIN_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`aw-nav-btn${activeId === item.id ? " is-active" : ""}`}
            aria-label={item.label}
            aria-current={activeId === item.id ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <NavIcon d={item.path} strokeWidth={item.id === "create" ? 2 : 1.6} />
          </button>
        ))}
      </nav>

      <nav className="aw-nav-bottom" aria-label="Secondary">
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`aw-nav-btn${activeId === item.id ? " is-active" : ""}`}
            aria-label={item.label}
            onClick={() => onNavigate(item.id)}
          >
            <NavIcon d={item.path} />
          </button>
        ))}
      </nav>
    </aside>
  );
}
