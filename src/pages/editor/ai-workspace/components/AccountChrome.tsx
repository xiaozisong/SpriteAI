import { CREDITS_TOTAL } from "../mock/assets";

interface AccountChromeProps {
  creditsUsed: number;
  displayName: string;
  avatarUrl?: string | null;
  onAccountClick?: () => void;
}

export function AccountChrome({
  creditsUsed,
  displayName,
  avatarUrl,
  onAccountClick,
}: AccountChromeProps) {
  return (
    <div className="aw-account-chrome">
      <div className="aw-credits" aria-live="polite">
        <span className="aw-credits-dot" aria-hidden="true" />
        <span>
          {creditsUsed} / {CREDITS_TOTAL} Credits Used
        </span>
      </div>

      <button
        type="button"
        className="aw-account-btn"
        onClick={onAccountClick}
        aria-label="Your account"
      >
        <span className="aw-avatar" aria-hidden="true">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : null}
        </span>
        <span className="label">{displayName || "Your account"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
