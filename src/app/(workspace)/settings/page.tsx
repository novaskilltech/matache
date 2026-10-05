import { PushSettings } from "@/components/push-settings";
import { isConfigured } from "@/lib/config";
import { signOut } from "@/app/mutations";
export default function Settings() {
  return (
    <>
      <h1>Paramètres</h1>
      <section className="card">
        <h2>Votre espace privé</h2>
        <p className="muted">
          Les captures restent dans un stockage privé. Les notifications ne
          contiennent aucune information client.
        </p>
        <h2>Rappels sur cet appareil</h2>
        <PushSettings />
        <form action={signOut} style={{ marginTop: 24 }}>
          <button className="secondary" disabled={!isConfigured()}>
            Se déconnecter
          </button>
        </form>
      </section>
    </>
  );
}
