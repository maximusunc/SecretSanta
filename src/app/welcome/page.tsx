import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/Forms";
import EmojiPicker from "@/components/EmojiPicker";
import { completeWelcome } from "../actions/auth";
import AuthShell from "../login/AuthShell";

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/");

  return (
    <AuthShell title={`Hi, ${user.name}!`} subtitle="Pick your own password and a festive avatar.">
      <ActionForm action={completeWelcome} className="space-y-4">
        <div>
          <span className="label">Your avatar</span>
          <EmojiPicker name="emoji" defaultValue={user.emoji} />
        </div>
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" minLength={8} required className="input" autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Type it again</label>
          <input id="confirm" name="confirm" type="password" minLength={8} required className="input" autoComplete="new-password" />
        </div>
        <SubmitButton className="btn-primary w-full py-3">Let&apos;s go! 🎅</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
