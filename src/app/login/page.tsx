import { LoginForm } from "@/components/login-form";
import { Brand } from "@/components/brand";
import { ShieldCheck } from "lucide-react";
export default function Login() {
  return (
    <main className="auth">
      <Brand />
      <p className="eyebrow">CHAQUE CLIENT COMPTE</p>
      <h1>Retrouvons vos clients.</h1>
      <p className="muted">Votre espace privé de suivi et de rappels.</p>
      <LoginForm />
      <p className="auth-footnote">
        <ShieldCheck size={16} aria-hidden="true" /> Un espace privé pour vos
        dossiers.
      </p>
    </main>
  );
}
