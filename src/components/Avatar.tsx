import { initials, ornamentFor } from "@/lib/ornaments";

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-2xl",
};

/** An ornament-coloured circle with the person's initials. `ring` = the gold "this is you" ring. */
export default function Avatar({
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
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${SIZES[size]} ${
        ring ? "shadow-[0_0_0_2px_var(--color-midnight),0_0_0_4px_var(--color-gold)]" : ""
      } ${className}`}
      style={{
        color: o.fg,
        background: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.28), transparent 45%), ${o.bg}`,
      }}
    >
      {initials(name)}
    </span>
  );
}
