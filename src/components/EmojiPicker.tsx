import { EMOJIS } from "@/lib/emojis";

/** Radio-button grid of avatar emojis (works without JavaScript). */
export default function EmojiPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {EMOJIS.map((e) => (
        <label key={e} className="cursor-pointer">
          <input type="radio" name={name} value={e} defaultChecked={e === defaultValue} className="peer sr-only" />
          <span className="grid aspect-square place-items-center rounded-xl bg-frost text-2xl ring-pine transition peer-checked:scale-110 peer-checked:bg-white peer-checked:ring-4 peer-focus-visible:ring-2">
            {e}
          </span>
        </label>
      ))}
    </div>
  );
}
