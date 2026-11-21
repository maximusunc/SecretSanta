export default function Avatar({
  emoji,
  size = "md",
  className = "",
}: {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-base",
    md: "h-11 w-11 text-2xl",
    lg: "h-16 w-16 text-4xl",
    xl: "h-24 w-24 text-6xl",
  };
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-frost ring-2 ring-white shadow ${sizes[size]} ${className}`}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
