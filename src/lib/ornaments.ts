/** Avatar colours: each person is an ornament-coloured tag with their first name on it. */
export const ORNAMENTS = {
  cranberry: { label: "Cranberry", bg: "#d2394a", fg: "#ffffff" },
  spruce: { label: "Spruce", bg: "#2f6b57", fg: "#ffffff" },
  candlelight: { label: "Candlelight", bg: "#f2b544", fg: "#0f1b2d" },
  winter: { label: "Winter blue", bg: "#3c5a86", fg: "#ffffff" },
  plum: { label: "Plum", bg: "#7a3e6e", fg: "#ffffff" },
  frost: { label: "Frost", bg: "#dce6f2", fg: "#0f1b2d" },
  copper: { label: "Copper", bg: "#b5652e", fg: "#ffffff" },
  silver: { label: "Silver", bg: "#8c97a6", fg: "#0f1b2d" },
} as const;

export type Ornament = keyof typeof ORNAMENTS;
export const ORNAMENT_IDS = Object.keys(ORNAMENTS) as Ornament[];

export const isOrnament = (v: string): v is Ornament => v in ORNAMENTS;
export const ornamentFor = (v: string) => ORNAMENTS[isOrnament(v) ? v : "spruce"];

/** "Blair Wang" → "Blair". Everyone shares a last name, so the first name is what tells people apart. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
