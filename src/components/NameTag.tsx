import { firstName, ornamentFor } from "@/lib/ornaments";

const SIZES = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-4 text-base",
};

/**
 * A person's avatar: their first name on a pill in their ornament colour.
 * (Everyone in the family shares a last name, so initials don't work.)
 * `ring` = the gold "this is you" ring.
 */
export default function NameTag({
  name,
  ornament,
  size = "md",
  ring = false,
  className = "",
}: {
  name: string;
  ornament: string;
  size?: keyof typeof SIZES;
  ring?: boolean;
  className?: string;
}) {
  const o = ornamentFor(ornament);
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center justify-center rounded-full font-bold ${SIZES[size]} ${
        ring ? "shadow-[0_0_0_2px_var(--color-midnight),0_0_0_4px_var(--color-gold)]" : ""
      } ${className}`}
      style={{
        color: o.fg,
        background: `radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.28), transparent 55%), ${o.bg}`,
      }}
    >
      <span className="truncate">{firstName(name)}</span>
    </span>
  );
}

/** Just the ornament colour, as a small dot (for lists that already print the full name). */
export function OrnamentDot({ ornament }: { ornament: string }) {
  return <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: ornamentFor(ornament).bg }} />;
}
