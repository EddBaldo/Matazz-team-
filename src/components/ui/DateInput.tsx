"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

const MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseISO(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

function formatDisplay(s: string): string {
  const p = parseISO(s);
  if (!p) return "";
  return `${pad(p.d)}/${pad(p.m + 1)}/${p.y}`;
}

export function DateInput({
  value,
  onChange,
  name,
  required,
  placeholder = "gg/mm/aaaa",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const parsed = parseISO(value);
  const today = new Date();
  const [viewY, setViewY] = useState<number>(parsed?.y ?? today.getFullYear());
  const [viewM, setViewM] = useState<number>(
    parsed?.m ?? today.getMonth(),
  );

  // Auto-flip popover a destra se sforerebbe il viewport
  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const dropdownWidth = 288; // w-72
    setAlignRight(rect.left + dropdownWidth > window.innerWidth - 16);
  }, [open]);

  useEffect(() => {
    if (open && parsed) {
      setViewY(parsed.y);
      setViewM(parsed.m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstWeekday = new Date(viewY, viewM, 1).getDay();
  const offset = (firstWeekday + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = isoOf(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (viewM === 0) {
      setViewM(11);
      setViewY(viewY - 1);
    } else {
      setViewM(viewM - 1);
    }
  }
  function nextMonth() {
    if (viewM === 11) {
      setViewM(0);
      setViewY(viewY + 1);
    } else {
      setViewM(viewM + 1);
    }
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
        <span className={value ? "tabular-nums" : "text-neutral-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-neutral-500 shrink-0" />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 w-72 bg-white border border-neutral-200 rounded-xl shadow-lg p-3 ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Mese precedente"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-neutral-900 capitalize">
              {MESI[viewM]} {viewY}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Mese successivo"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {GIORNI.map((g, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-wide text-neutral-400 pb-1"
              >
                {g}
              </span>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const iso = isoOf(viewY, viewM, d);
              const isSelected = iso === value;
              const isToday = iso === todayStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`aspect-square flex items-center justify-center text-sm rounded-full tabular-nums transition-colors ${
                    isSelected
                      ? "bg-neutral-900 text-white font-semibold"
                      : isToday
                        ? "text-amber-700 font-semibold hover:bg-amber-50"
                        : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          {value && (
            <div className="flex justify-between mt-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 px-2 py-1"
              >
                Cancella
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(todayStr);
                  setOpen(false);
                }}
                className="text-xs text-amber-700 hover:text-amber-800 px-2 py-1 font-medium"
              >
                Oggi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
