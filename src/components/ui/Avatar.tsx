import { cn } from "@/lib/cn";

const PALETTE = [
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
};

type Props = {
  name: string;
  size?: Size;
  className?: string;
};

export function Avatar({ name, size = "md", className }: Props) {
  const trimmed = name.trim();
  const color = PALETTE[hash(trimmed) % PALETTE.length];
  const initial = trimmed.charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill font-medium text-white shrink-0 select-none",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
