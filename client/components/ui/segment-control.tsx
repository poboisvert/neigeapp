import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentControlProps<T extends string> {
  options: SegmentControlOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  darkMode?: boolean;
}

export function SegmentControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  darkMode = false,
}: SegmentControlProps<T>) {
  return (
    <div
      className={cn(
        "grid rounded-lg p-1",
        darkMode ? "bg-gray-700" : "bg-gray-100",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onValueChange(option.value)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            value === option.value
              ? darkMode
                ? "bg-gray-900 text-gray-100 shadow-sm"
                : "bg-white text-gray-900 shadow-sm"
              : darkMode
              ? "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
