"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  placeholder?: string;
}

// Select-all on focus so the user doesn't have to delete 0 first
export function NumInput({ value, onChange, min = 0, placeholder }: Props) {
  return (
    <input
      className="input"
      type="number"
      min={min}
      value={value}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) =>
        onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)
      }
    />
  );
}
