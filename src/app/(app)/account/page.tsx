import { requireUser } from "@/lib/auth";
import EmojiPicker from "@/components/EmojiPicker";
import { ActionForm, SubmitButton } from "@/components/Forms";
import { changePassword, logout, updateEmoji } from "../../actions/auth";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="font-display text-4xl font-bold">Your account</h1>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Avatar</h2>
        <ActionForm action={updateEmoji} className="space-y-3">
          <EmojiPicker name="emoji" defaultValue={user.emoji} />
          <SubmitButton className="btn-green">Save avatar</SubmitButton>
        </ActionForm>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Change password</h2>
        <ActionForm action={changePassword} resetOnSuccess className="space-y-3">
          <input name="current" type="password" placeholder="Current password" required className="input" autoComplete="current-password" />
          <input name="password" type="password" placeholder="New password (8+ characters)" minLength={8} required className="input" autoComplete="new-password" />
          <SubmitButton className="btn-ghost">Update password</SubmitButton>
        </ActionForm>
      </section>

      <form action={logout}>
        <button className="btn-ghost w-full">Sign out of {user.email}</button>
      </form>
    </div>
  );
}
