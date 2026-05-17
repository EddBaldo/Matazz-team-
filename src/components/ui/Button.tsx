import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none";

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-base",
  sm: "h-9 px-3 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700",
  secondary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
});
