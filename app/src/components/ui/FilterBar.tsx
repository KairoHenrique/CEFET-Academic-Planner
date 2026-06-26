"use client";

interface FilterBarProps {
  filters: string[];
  active: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  nowrap?: boolean;
  className?: string;
}

export function FilterBar({
  filters,
  active,
  onChange,
  ariaLabel = "Filtros",
  nowrap = false,
  className = "",
}: FilterBarProps) {
  return (
    <div
      className={`filter-bar ${nowrap ? "filter-bar--nowrap" : ""} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={active === filter}
          className={`filter-chip ${active === filter ? "active" : ""}`}
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
