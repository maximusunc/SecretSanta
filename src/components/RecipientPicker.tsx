"use client";

import type { User } from "@/lib/auth";
import { recordMyRecipient } from "@/app/actions/exchange";
import { ActionForm, SubmitButton } from "./Forms";
import { firstName } from "@/lib/ornaments";

/** For hand-drawn years: privately pick who you have. Renders on ivory. */
export default function RecipientPicker({
  exchangeId,
  users,
  current,
}: {
  exchangeId: number;
  users: Pick<User, "id" | "name">[];
  current?: number;
}) {
  return (
    <ActionForm action={recordMyRecipient} className="space-y-3">
      <input type="hidden" name="exchangeId" value={exchangeId} />
      <label className="label" htmlFor={`recipient-${exchangeId}`}>
        I&apos;m buying for
      </label>
      <select id={`recipient-${exchangeId}`} name="receiverId" defaultValue={current ?? ""} className="input" required>
        <option value="" disabled>
          Choose a person…
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {firstName(u.name)}
          </option>
        ))}
      </select>
      <SubmitButton className="btn-spruce w-full">Save (only you can see this)</SubmitButton>
    </ActionForm>
  );
}
