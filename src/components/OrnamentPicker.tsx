import { initials, ORNAMENT_IDS, ORNAMENTS } from "@/lib/ornaments";

/** Radio grid of ornament colours (works without JavaScript). For use on navy. */
export default function OrnamentPicker({
  name,
  defaultValue,
  personName,
}: {
  name: string;
  defaultValue: string;
  personName: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {ORNAMENT_IDS.map((id) => {
        const o = ORNAMENTS[id];
        return (
          <label key={id} className="cursor-pointer">
            <input type="radio" name={name} value={id} defaultChecked={id === defaultValue} className="peer sr-only" />
            <span className="flex h-[76px] flex-col items-center justify-center rounded-2xl bg-white/5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition peer-checked:bg-gold/15 peer-checked:shadow-[inset_0_0_0_2px_var(--color-gold)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
              <span aria-hidden className="h-2 w-3.5 rounded-t-[3px] bg-tan" />
              <span
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[15px] font-bold"
                style={{
                  color: o.fg,
                  background: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.45), transparent 45%), ${o.bg}`,
                }}
              >
                {initials(personName)}
              </span>
              <span className="sr-only">{o.label}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
