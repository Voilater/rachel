import { formatPrice } from "@/lib/site-data";
import { cn } from "@/lib/utils";

interface PriceProps {
  amount: number;
  className?: string;
  emphasis?: boolean;
}

/** Consistent INR display — sans tabular nums (avoids serif ₹ glyph issues). */
export function Price({ amount, className, emphasis = false }: PriceProps) {
  return (
    <span
      className={cn(
        "tabular-nums tracking-normal",
        emphasis
          ? "font-semibold text-burgundy"
          : "font-medium text-foreground",
        className,
      )}
    >
      {formatPrice(amount)}
    </span>
  );
}
