"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  name?: string;
  disabled?: boolean;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "— Scegli —",
  required,
  name,
  disabled,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [focusIdx, setFocusIdx] = useState<number>(-1);

  const current = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const close = useCallback(() => {
    setOpen(false);
    setFocusIdx(-1);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(ev: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(ev.target as Node)) close();
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") close();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function handleKey(ev: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (!open) {
      if (
        ev.key === "ArrowDown" ||
        ev.key === "ArrowUp" ||
        ev.key === "Enter" ||
        ev.key === " "
      ) {
        ev.preventDefault();
        setOpen(true);
        setFocusIdx(
          options.findIndex((o) => o.value === value && !o.disabled),
        );
      }
      return;
    }

    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setFocusIdx((i) => {
        const next = i + 1;
        return next >= options.length ? 0 : next;
      });
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setFocusIdx((i) => {
        const next = i - 1;
        return next < 0 ? options.length - 1 : next;
      });
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (focusIdx >= 0 && focusIdx < options.length) {
        const opt = options[focusIdx];
        if (!opt.disabled) {
          onChange(opt.value);
          close();
        }
      }
    }
  }

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      onKeyDown={handleKey}
    >
      {/* Hidden input per form submission e validation HTML */}
      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
      />
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          disabled
            ? "bg-neutral-50 text-neutral-400 border-neutral-200"
            : open
              ? "border-amber-500 bg-white text-neutral-900"
              : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400"
        }`}
      >
        <span className={current ? "" : "text-neutral-400"}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg py-1"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-neutral-400 italic">
              Nessuna opzione
            </li>
          )}
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusIdx;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onMouseEnter={() => !opt.disabled && setFocusIdx(idx)}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  close();
                }}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${
                  opt.disabled
                    ? "text-neutral-300 cursor-not-allowed"
                    : isFocused
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-800 hover:bg-neutral-50"
                } ${isSelected ? "font-medium" : ""}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
