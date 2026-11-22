import { redirect } from "next/navigation";
import { connection } from "next/server";
import { userCount } from "@/lib/users";
import { ActionForm, SubmitButton } from "@/components/Forms";
import { setupAdmin } from "../actions/auth";
import AuthShell from "../login/AuthShell";

export default async function SetupPage() {
  await connection(); // decided per request, never at build time
  if (userCount() > 0) redirect("/login");
  return (
    <AuthShell title="Welcome!" subtitle="Create the admin account. This page only appears once.">
      <ActionForm action={setupAdmin} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" required className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="username" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={8} required className="input" autoComplete="new-password" />
        </div>
        <SubmitButton className="btn-spruce mt-1 w-full">Create admin account</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
