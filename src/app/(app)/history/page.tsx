import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getMyAssignment, isRevealed, listExchanges, revealedPairs } from "@/lib/exchanges";
import { listUsers } from "@/lib/users";
import Avatar from "@/components/Avatar";
import RecipientPicker from "@/components/RecipientPicker";

export default async function HistoryPage() {
  const user = await requireUser();
  const users = listUsers();
  const byId = new Map(users.map((u) => [u.id, u]));
  const exchanges = listExchanges();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Christmases past</h1>
      <p className="mb-5 text-muted">Who gave to whom, revealed once each year&apos;s secret is out.</p>

      {exchanges.length === 0 && <p className="card p-8 text-center text-muted">No exchanges yet.</p>}

      <div className="space-y-4">
        {exchanges.map((ex) => {
          const revealed = isRevealed(ex);
          const mine = getMyAssignment(ex.id, user.id);
          const myGiftee = mine ? byId.get(mine.receiverId) : null;
          return (
            <section key={ex.id} className="card overflow-hidden">
              <div className="flex items-baseline justify-between bg-gradient-to-r from-pine to-pine-dark px-5 py-3 text-white">
                <h2 className="font-display text-3xl font-bold">{ex.year}</h2>
                {ex.budget && <span className="text-sm font-semibold text-white/80">Budget {ex.budget}</span>}
              </div>
              <div className="p-5">
                {revealed ? (
                  <ul className="space-y-2">
                    {revealedPairs(ex.id).map((p) => {
                      const g = byId.get(p.giverId);
                      const r = byId.get(p.receiverId);
                      if (!g || !r) return null;
                      return (
                        <li key={p.giverId} className="flex items-center gap-2">
                          <Avatar emoji={g.emoji} size="sm" />
                          <span className="font-semibold">{g.name}</span>
                          <span className="text-muted">gave to</span>
                          <Avatar emoji={r.emoji} size="sm" />
                          <span className="font-semibold">{r.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted">
                      🤫 Still a secret
                      {ex.revealDate ? ` — revealed ${formatDate(ex.revealDate)}.` : "."}
                    </p>
                    {myGiftee && (
                      <p>
                        You&apos;re giving to <strong>{myGiftee.emoji} {myGiftee.name}</strong>.
                      </p>
                    )}
                  </div>
                )}

                {ex.mode === "manual" && !revealed && (
                  <details className="mt-4" open={!mine}>
                    <summary className="cursor-pointer text-sm font-semibold text-pine">
                      {mine ? "Change who you had" : `Who did you have in ${ex.year}? (private)`}
                    </summary>
                    <p className="my-2 text-xs text-muted">
                      This helps the app avoid giving you the same person next year. Nobody else can see it.
                    </p>
                    <RecipientPicker
                      exchangeId={ex.id}
                      users={users.filter((u) => u.id !== user.id)}
                      current={mine?.receiverId}
                    />
                  </details>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
