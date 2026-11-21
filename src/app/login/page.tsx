import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userCount } from "@/lib/users";
import { ActionForm, SubmitButton } from "@/components/Forms";
import { login } from "../actions/auth";
import AuthShell from "./AuthShell";

export default async function LoginPage() {
  await connection(); // decided per request, never at build time
  if (userCount() === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/");

  return (
    <AuthShell title="Secret Santa" subtitle="Sign in to see who you're shopping for">
      <ActionForm action={login} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        <SubmitButton className="btn-primary w-full py-3 text-lg" pending="Checking the list…">
          Sign in 🎄
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-muted">
        Forgot your password? Ask the family admin to reset it.
      </p>
    </AuthShell>
  );
}
