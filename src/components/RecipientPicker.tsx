"use client";

import type { User } from "@/lib/auth";
import { recordMyRecipient } from "@/app/actions/exchange";
import { ActionForm, SubmitButton } from "./Forms";

export default function RecipientPicker({
  exchangeId,
  users,
  current,
}: {
  exchangeId: number;
  users: Pick<User, "id" | "name" | "emoji">[];
  current?: number;
}) {
  return (
    <ActionForm action={recordMyRecipient} className="space-y-3">
      <input type="hidden" name="exchangeId" value={exchangeId} />
      <select name="receiverId" defaultValue={current ?? ""} className="input" required>
        <option value="" disabled>
          Choose a person…
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.emoji} {u.name}
          </option>
        ))}
      </select>
      <SubmitButton className="btn-green w-full">Save (only you can see this)</SubmitButton>
    </ActionForm>
  );
}
