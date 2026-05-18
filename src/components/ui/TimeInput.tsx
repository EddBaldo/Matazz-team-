"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  value: string; // "HH:MM" or ""
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
  /** Step in minutes for the minute picker. Default 5. */
  minuteStep?: number;
  className?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseHM(s: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

export function TimeInput({
  value,
  onChange,
  name,
  required,
  placeholder = "--:--",
  minuteStep = 5,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const parsed = parseHM(value);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes: number[] = [];
  for (let m = 0; m < 60; m += minuteStep) minutes.push(m);

  // Auto-flip popover a destra se sforerebbe il container (modal o viewport)
  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const dropdownWidth = 176; // w-44

    // Cerca il dialog/modal antenato; se non c'è usa il viewport
    let containerRight = window.innerWidth;
    let el: HTMLElement | null = wrapRef.current.parentElement;
    while (el) {
      if (el.tagName === "DIALOG" || el.getAttribute("role") === "dialog") {
        containerRight = el.getBoundingClientRect().right;
        break;
      }
      el = el.parentElement;
    }
    setAlignRight(rect.left + dropdownWidth > containerRight - 16);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClick(ev: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(ev.target as Node)) setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Auto-scroll to selected when opening
  useEffect(() => {
    if (!open || !parsed) return;
    setTimeout(() => {
      const hEl = hoursRef.current?.querySelector<HTMLButtonElement>(
        `[data-h="${parsed.h}"]`,
      );
      const mEl = minutesRef.current?.querySelector<HTMLButtonElement>(
        `[data-m="${parsed.m}"]`,
      );
      hEl?.scrollIntoView({ block: "center" });
      mEl?.scrollIntoView({ block: "center" });
    }, 0);
  }, [open, parsed]);

  function set(h: number, m: number) {
    onChange(`${pad(h)}:${pad(m)}`);
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          open
            ? "border-amber-500 bg-white text-neutral-900"
            : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400"
        }`}
      >
        <span className={parsed ? "tabular-nums" : "text-neutral-400"}>
          {parsed ? `${pad(parsed.h)}:${pad(parsed.m)}` : placeholder}
        </span>
        <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 w-44 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <div className="grid grid-cols-2 divide-x divide-neutral-100">
            <div
              ref={hoursRef}
              className="max-h-52 overflow-y-auto py-1"
            >
              {hours.map((h) => {
                const isSel = parsed?.h === h;
                return (
                  <button
                    key={h}
                    type="button"
                    data-h={h}
                    onClick={() => set(h, parsed?.m ?? 0)}
                    className={`w-full text-center py-1.5 text-sm tabular-nums ${
                      isSel
                        ? "bg-neutral-900 text-white font-semibold"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {pad(h)}
                  </button>
                );
              })}
            </div>
            <div
              ref={minutesRef}
              className="max-h-52 overflow-y-auto py-1"
            >
              {minutes.map((m) => {
                const isSel = parsed?.m === m;
                return (
                  <button
                    key={m}
                    type="button"
                    data-m={m}
                    onClick={() => set(parsed?.h ?? 0, m)}
                    className={`w-full text-center py-1.5 text-sm tabular-nums ${
                      isSel
                        ? "bg-neutral-900 text-white font-semibold"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {pad(m)}
                  </button>
                );
              })}
            </div>
          </div>
          {value && (
            <div className="flex justify-end border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 px-3 py-1.5"
              >
                Cancella
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
