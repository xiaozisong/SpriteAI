import { SUGGESTION_CHIPS } from "../mock/assets";

interface SuggestionChipsProps {
  onSelect: (chip: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="aw-chips" role="list" aria-label="Prompt suggestions">
      {SUGGESTION_CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          className="aw-chip"
          role="listitem"
          onClick={() => onSelect(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
