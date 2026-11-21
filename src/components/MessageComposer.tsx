"use client";

import { useActionState, useEffect, useRef } from "react";
import { postMessage } from "@/app/actions/messages";
import { FormMessage, SubmitButton } from "./Forms";

export default function MessageComposer({ to }: { to: "giftee" | "santa" }) {
  const [state, action] = useActionState(postMessage, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action}>
      <input type="hidden" name="to" value={to} />
      <div className="flex items-end gap-2">
        <textarea
          name="body"
          rows={1}
          required
          maxLength={2000}
          placeholder={to === "giftee" ? "Message your giftee…" : "Message your Santa…"}
          className="input max-h-40 min-h-12 resize-y"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <SubmitButton className="btn-primary h-12 px-5" pending="…">Send</SubmitButton>
      </div>
      <FormMessage state={state?.error ? state : null} />
    </form>
  );
}
