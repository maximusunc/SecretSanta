import { requireUser } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import { ActionForm, SubmitButton } from "@/components/Forms";
import OrnamentPicker from "@/components/OrnamentPicker";
import { changePassword, logout, updateOrnament } from "../../actions/auth";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} ornament={user.ornament} size="lg" ring />
        <div className="flex flex-col">
          <h1 className="font-display text-4xl font-semibold leading-tight">{user.name}</h1>
          <span className="text-sm text-mist">{user.email}</span>
        </div>
      </div>

      <section className="flex flex-col gap-3.5">
        <h2 className="eyebrow text-mist">Your ornament</h2>
        <ActionForm action={updateOrnament} className="flex flex-col gap-4">
          <OrnamentPicker name="ornament" defaultValue={user.ornament} personName={user.name} />
          <SubmitButton className="btn-gold">Save ornament</SubmitButton>
        </ActionForm>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-display text-xl font-semibold">Change password</h2>
        <ActionForm action={changePassword} resetOnSuccess className="flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="current">Current password</label>
            <input id="current" name="current" type="password" required className="input" autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="new-password">New password (8+ characters)</label>
            <input id="new-password" name="password" type="password" minLength={8} required className="input" autoComplete="new-password" />
          </div>
          <SubmitButton className="btn-spruce">Update password</SubmitButton>
        </ActionForm>
      </section>

      <form action={logout}>
        <button className="btn-outline w-full">Sign out</button>
      </form>
    </div>
  );
}
