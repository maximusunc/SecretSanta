"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { postMessage } from "@/app/actions/messages";
import { FormMessage } from "./Forms";
import { SendIcon } from "./Icons";

export default function MessageComposer({ to, placeholder }: { to: "giftee" | "santa"; placeholder: string }) {
  const [state, action] = useActionState(postMessage, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action}>
      <input type="hidden" name="to" value={to} />
      <div className="flex items-end gap-2.5">
        <label htmlFor="message-body" className="sr-only">Message</label>
        <textarea
          id="message-body"
          name="body"
          rows={1}
          required
          maxLength={2000}
          placeholder={placeholder}
          className="max-h-40 min-h-12 flex-1 resize-y rounded-3xl border-[1.5px] border-[#2b3d57] bg-deep px-4 py-3 text-base text-snow outline-none placeholder:text-mist/80 focus:border-gold"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <SendButton />
      </div>
      <FormMessage state={state?.error ? state : null} />
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label="Send"
      disabled={pending}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cranberry text-white transition hover:bg-cranberry-dark active:scale-95 disabled:opacity-60"
    >
      <SendIcon size={20} />
    </button>
  );
}
