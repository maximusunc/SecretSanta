import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getMyAssignment, isRevealed, listExchanges, revealedPairs } from "@/lib/exchanges";
import { listUsers } from "@/lib/users";
import NameTag from "@/components/NameTag";
import RecipientPicker from "@/components/RecipientPicker";

export default async function HistoryPage() {
  const user = await requireUser();
  const users = listUsers();
  const byId = new Map(users.map((u) => [u.id, u]));
  const exchanges = listExchanges();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-4xl font-semibold leading-tight">Christmases past</h1>
        <p className="text-[15px] text-haze">Who gave to whom, revealed once each year&apos;s secret is out.</p>
      </div>

      {exchanges.length === 0 && <p className="panel p-8 text-center text-mist">No exchanges yet.</p>}

      {exchanges.map((ex) => {
        const revealed = isRevealed(ex);
        const mine = getMyAssignment(ex.id, user.id);
        const myGiftee = mine ? byId.get(mine.receiverId) : null;
        return (
          <section key={ex.id} className="card overflow-hidden">
            <div className="flex items-baseline justify-between bg-night px-5 py-3.5 text-snow">
              <h2 className="font-display text-3xl font-bold text-gold">{ex.year}</h2>
              {ex.budget && <span className="text-sm font-medium text-mist">Budget {ex.budget}</span>}
            </div>
            <div className="flex flex-col gap-4 p-5">
              {revealed ? (
                <ul className="flex flex-col gap-3">
                  {revealedPairs(ex.id).map((p) => {
                    const g = byId.get(p.giverId);
                    const r = byId.get(p.receiverId);
                    if (!g || !r) return null;
                    return (
                      <li key={p.giverId} className="flex flex-wrap items-center gap-2.5">
                        <NameTag name={g.name} ornament={g.ornament} />
                        <span className="text-sm text-muted">gave to</span>
                        <NameTag name={r.name} ornament={r.ornament} />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-muted">
                    Still a secret{ex.revealDate ? `. Revealed ${formatDate(ex.revealDate)}.` : "."}
                  </p>
                  {myGiftee && (
                    <p className="flex flex-wrap items-center gap-2">
                      You&apos;re giving to
                      <NameTag name={myGiftee.name} ornament={myGiftee.ornament} />
                    </p>
                  )}
                </div>
              )}

              {ex.mode === "manual" && !revealed && (
                <details open={!mine}>
                  <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-spruce">
                    {mine ? "Change who you had" : `Who did you have in ${ex.year}? (private)`}
                  </summary>
                  <p className="mb-3 text-[13px] text-muted">
                    This helps the app avoid giving you the same person next year. Nobody else can see it.
                  </p>
                  <RecipientPicker exchangeId={ex.id} users={users.filter((u) => u.id !== user.id)} current={mine?.receiverId} />
                </details>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
