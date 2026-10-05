import { snoozeOptions, snoozeLabels } from "@/lib/domain/reminders";
import { snoozeAction, followUp } from "@/app/mutations";
import { isConfigured } from "@/lib/config";
export function Snooze({ id, status }: { id: string; status: string }) {
  return (
    <>
      <section className="card" style={{ marginTop: 20 }}>
        <h2>Reporter / programmer un rappel</h2>
        <form action={snoozeAction} className="stack">
          <input type="hidden" name="id" value={id} />
          <label htmlFor="option">Quand souhaitez-vous agir ?</label>
          <select id="option" name="option" defaultValue="tomorrow">
            {snoozeOptions.map((o) => (
              <option value={o} key={o}>
                {snoozeLabels[o]}
              </option>
            ))}
          </select>
          <label htmlFor="custom">Date personnalisée (heure de Paris)</label>
          <input id="custom" name="custom" type="datetime-local" />
          <button disabled={!isConfigured() || status === "DONE"}>
            REPORTER
          </button>
        </form>
      </section>
      {status === "WAITING" && (
        <section className="card" style={{ marginTop: 20 }}>
          <h2>En attente du client</h2>
          <p className="muted">
            Remettez le dossier dans vos prochaines actions dès qu’une relance
            ou une vérification est nécessaire.
          </p>
          <div className="row">
            {[
              ["FOLLOW_UP", "Relancer"],
              ["DOCUMENTS_RECEIVED", "Documents reçus"],
            ].map(([kind, label]) => (
              <form action={followUp} key={kind}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="kind" value={kind} />
                <button className="secondary" disabled={!isConfigured()}>
                  {label}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
