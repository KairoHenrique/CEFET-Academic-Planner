"use client";

interface FilterBarProps {
  filters: string[];
  active: string;
  onChange: (value: string) => void;
}

export function FilterBar({ filters, active, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="tablist" aria-label="Filtros">
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
