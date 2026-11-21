import { requireAdmin, type User } from "@/lib/auth";
import {
  getCurrentExchange,
  isActive,
  listExchanges,
  previousYearPairs,
  progress,
  type Exchange,
} from "@/lib/exchanges";
import { listUsers } from "@/lib/users";
import Avatar from "@/components/Avatar";
import { ActionForm, SubmitButton } from "@/components/Forms";
import {
  createExchange,
  createUser,
  deleteExchange,
  deleteUser,
  drawNamesAction,
  editUser,
  resetPassword,
  toggleAdmin,
  updateExchange,
} from "../../actions/admin";

export default async function AdminPage() {
  const me = await requireAdmin();
  const users = listUsers();
  const current = getCurrentExchange();
  const exchanges = listExchanges();
  const thisYear = new Date().getFullYear();
  const suggestedYear = current ? Math.max(current.year + 1, thisYear) : thisYear;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold">Elf HQ</h1>
        <p className="text-muted">
          Set up the exchange and manage the family. You can never see who drew whom (until the
          reveal date, when everyone can).
        </p>
      </div>

      {current && <CurrentExchange ex={current} users={users} />}

      <Section title={`Start a new exchange`} icon="🎄">
        <ActionForm action={createExchange} className="grid gap-3 sm:grid-cols-2">
          <Field label="Year">
            <input name="year" type="number" defaultValue={suggestedYear} className="input" required />
          </Field>
          <Field label="Budget">
            <input name="budget" placeholder="$50" className="input" />
          </Field>
          <Field label="Gift exchange date">
            <input name="exchangeDate" type="date" defaultValue={`${suggestedYear}-12-25`} className="input" />
          </Field>
          <Field label="Reveal Santas on">
            <input name="revealDate" type="date" defaultValue={`${suggestedYear}-12-25`} className="input" />
          </Field>
          <Field label="How are names drawn?" wide>
            <select name="mode" className="input" defaultValue="draw">
              <option value="draw">The app draws names (recommended)</option>
              <option value="manual">Already drawn on paper — each person enters who they have</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-green">Create exchange</SubmitButton>
          </div>
        </ActionForm>
      </Section>

      <Section title="Family members" icon="👨‍👩‍👧‍👦">
        <ul className="divide-y divide-ink/10">
          {users.map((u) => (
            <MemberRow key={u.id} user={u} users={users} isMe={u.id === me.id} />
          ))}
        </ul>
        <div className="mt-5 rounded-xl bg-frost/60 p-4">
          <h3 className="mb-3 font-bold">Add someone</h3>
          <ActionForm action={createUser} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Name"><input name="name" required className="input" /></Field>
            <Field label="Email"><input name="email" type="email" required className="input" /></Field>
            <SubmitButton className="btn-primary">Add</SubmitButton>
          </ActionForm>
          <p className="mt-2 text-xs text-muted">
            A temporary password is generated; they choose their own on first sign-in.
          </p>
        </div>
      </Section>

      {exchanges.length > 0 && (
        <Section title="All exchanges" icon="📜">
          <ul className="divide-y divide-ink/10">
            {exchanges.map((ex) => (
              <li key={ex.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="font-display text-2xl font-bold">{ex.year}</span>
                <span className="text-sm text-muted">
                  {ex.mode === "manual" ? "Drawn on paper" : ex.drawnAt ? "Drawn in app" : "Not drawn yet"}
                  {ex.budget && ` · ${ex.budget}`}
                </span>
                <ActionForm
                  action={deleteExchange}
                  className="ml-auto"
                  confirm={`Delete the ${ex.year} exchange, including its pairings and messages? This can't be undone.`}
                >
                  <input type="hidden" name="id" value={ex.id} />
                  <SubmitButton className="text-sm font-semibold text-muted hover:text-berry">Delete</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function CurrentExchange({ ex, users }: { ex: Exchange; users: User[] }) {
  const prog = progress(ex.id);
  const prev = previousYearPairs(ex.year);
  const spouses = users.filter((u) => u.spouseId && u.id < u.spouseId);
  const nameOf = (id: number | null) => users.find((u) => u.id === id)?.name;

  return (
    <Section title={`${ex.year} exchange`} icon="🎁">
      <ActionForm action={updateExchange} className="grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="id" value={ex.id} />
        <Field label="Budget"><input name="budget" defaultValue={ex.budget} placeholder="$50" className="input" /></Field>
        <Field label="Gift exchange date"><input name="exchangeDate" type="date" defaultValue={ex.exchangeDate ?? ""} className="input" /></Field>
        <Field label="Reveal Santas on"><input name="revealDate" type="date" defaultValue={ex.revealDate ?? ""} className="input" /></Field>
        <div className="sm:col-span-3"><SubmitButton className="btn-ghost">Save details</SubmitButton></div>
      </ActionForm>

      <div className="mt-6 rounded-xl border-2 border-dashed border-gold bg-gold/10 p-4">
        {ex.mode === "manual" ? (
          <>
            <h3 className="font-bold">Names were drawn on paper</h3>
            <p className="text-sm text-muted">
              Each person records who they have on their home page. You&apos;ll only see who has done it — not who they picked.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-bold">{ex.drawnAt ? "Names have been drawn ✅" : "Ready to draw names?"}</h3>
            <ul className="my-2 space-y-0.5 text-sm text-ink/80">
              <li>• {users.length} people participating</li>
              <li>
                • Spouses never draw each other:{" "}
                {spouses.length ? spouses.map((u) => `${u.name} & ${nameOf(u.spouseId)}`).join(", ") : "none set (edit members below)"}
              </li>
              <li>
                • Nobody gets the same person as {ex.year - 1}:{" "}
                {prev.size ? `${prev.size} of ${users.length} pairings known` : `no ${ex.year - 1} pairings recorded`}
              </li>
            </ul>
            <ActionForm
              action={drawNamesAction}
              confirm={
                ex.drawnAt
                  ? "Names were already drawn. Redrawing gives everyone a NEW person and deletes all secret messages. Are you sure?"
                  : "Draw names now? Everyone will be able to unwrap their assignment."
              }
            >
              <input type="hidden" name="id" value={ex.id} />
              <label className="mb-3 flex items-center gap-2 text-sm">
                <input type="checkbox" name="ignorePreviousYear" className="h-4 w-4 accent-pine" />
                Ignore last year&apos;s pairings (only if a draw is impossible otherwise)
              </label>
              <SubmitButton className={ex.drawnAt ? "btn-ghost" : "btn-primary text-lg"} pending="Shaking the hat… 🎩">
                {ex.drawnAt ? "Redraw names" : "🎩 Draw names!"}
              </SubmitButton>
            </ActionForm>
          </>
        )}
      </div>

      {isActive(ex) && (
        <div className="mt-5">
          <h3 className="mb-2 font-bold">{ex.mode === "manual" ? "Who has entered their person" : "Who has unwrapped their assignment"}</h3>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => {
              const p = prog.get(u.id);
              const ok = ex.mode === "manual" ? !!p : !!p?.seen;
              return (
                <span key={u.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${ok ? "bg-pine/15 text-pine" : "bg-ink/5 text-muted"}`}>
                  {u.emoji} {u.name} {ok ? "✓" : "…"}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}

function MemberRow({ user, users, isMe }: { user: User; users: User[]; isMe: boolean }) {
  return (
    <li className="py-3">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3">
          <Avatar emoji={user.emoji} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="font-bold">
              {user.name}
              {user.isAdmin && <span className="ml-2 rounded-full bg-gold/30 px-2 py-0.5 text-xs">admin</span>}
              {user.mustChangePassword && <span className="ml-2 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-muted">hasn&apos;t signed in yet</span>}
            </div>
            <div className="truncate text-sm text-muted">
              {user.email}
              {user.spouseId && ` · 💑 ${users.find((u) => u.id === user.spouseId)?.name}`}
            </div>
          </div>
          <span className="text-muted transition group-open:rotate-90">›</span>
        </summary>

        <div className="mt-3 space-y-3 rounded-xl bg-frost/50 p-3">
          <ActionForm action={editUser} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="id" value={user.id} />
            <Field label="Name"><input name="name" defaultValue={user.name} className="input" required /></Field>
            <Field label="Email"><input name="email" type="email" defaultValue={user.email} className="input" required /></Field>
            <Field label="Spouse / partner">
              <select name="spouseId" defaultValue={user.spouseId ?? ""} className="input">
                <option value="">None</option>
                {users.filter((u) => u.id !== user.id).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-3"><SubmitButton className="btn-green px-4 py-2 text-sm">Save</SubmitButton></div>
          </ActionForm>
          <div className="flex flex-wrap gap-2">
            <ActionForm action={resetPassword} confirm={`Reset ${user.name}'s password? They'll be signed out.`}>
              <input type="hidden" name="id" value={user.id} />
              <SubmitButton className="btn-ghost px-4 py-2 text-sm">Reset password</SubmitButton>
            </ActionForm>
            {!isMe && (
              <>
                <ActionForm action={toggleAdmin}>
                  <input type="hidden" name="id" value={user.id} />
                  <SubmitButton className="btn-ghost px-4 py-2 text-sm">{user.isAdmin ? "Remove admin" : "Make admin"}</SubmitButton>
                </ActionForm>
                <ActionForm action={deleteUser} confirm={`Remove ${user.name} and their board? This can't be undone.`}>
                  <input type="hidden" name="id" value={user.id} />
                  <SubmitButton className="btn-ghost px-4 py-2 text-sm text-berry">Remove</SubmitButton>
                </ActionForm>
              </>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
        <span aria-hidden>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
