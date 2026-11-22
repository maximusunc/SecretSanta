import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/Forms";
import OrnamentPicker from "@/components/OrnamentPicker";
import UsernameField from "@/components/UsernameField";
import { completeWelcome } from "../actions/auth";
import { firstName } from "@/lib/ornaments";

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-14">
      <ActionForm action={completeWelcome} className="flex flex-1 flex-col gap-6">
        <UsernameField email={user.email} />
        <div className="flex flex-col gap-2">
          <span className="eyebrow text-gold">One quick step</span>
          <h1 className="font-display text-[40px] font-bold leading-[1.05]">Welcome, {firstName(user.name)}</h1>
          <p className="text-base leading-relaxed text-haze">
            Choose your ornament and set a password only you know.
          </p>
        </div>

        <fieldset className="flex flex-col gap-3.5">
          <legend className="eyebrow mb-3.5 text-mist">Your ornament</legend>
          <OrnamentPicker name="ornament" defaultValue={user.ornament} personName={user.name} />
        </fieldset>

        <div className="card flex flex-col gap-4 p-5">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" name="password" type="password" minLength={8} required className="input" autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Type it again</label>
            <input id="confirm" name="confirm" type="password" minLength={8} required className="input" autoComplete="new-password" />
          </div>
        </div>

        <SubmitButton className="btn-gold mt-auto w-full text-[17px]">Let&apos;s go</SubmitButton>
      </ActionForm>
    </main>
  );
}
