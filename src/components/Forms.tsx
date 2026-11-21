"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type ActionResult = { ok?: string; error?: string } | null;
export type FormAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

export function SubmitButton({
  children,
  pending,
  className = "btn-primary",
  ...rest
}: { children: ReactNode; pending?: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const status = useFormStatus();
  return (
    <button type="submit" className={className} disabled={status.pending} {...rest}>
      {status.pending ? (pending ?? "Working…") : children}
    </button>
  );
}

/**
 * A <form> bound to a server action returning {ok?, error?}. Shows the message
 * underneath and optionally resets the form on success.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  confirm,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <FormMessage state={state} />
    </form>
  );
}

export function FormMessage({ state }: { state: ActionResult }) {
  if (!state?.ok && !state?.error) return null;
  return (
    <p
      role="status"
      className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
        state.error ? "bg-berry/10 text-berry" : "bg-pine/10 text-pine"
      }`}
    >
      {state.error ?? state.ok}
    </p>
  );
}
