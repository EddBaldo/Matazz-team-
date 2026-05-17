import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { className, padding = "md", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-white border border-neutral-200 rounded-card",
        paddings[padding],
        className,
      )}
      {...props}
    />
  );
});
