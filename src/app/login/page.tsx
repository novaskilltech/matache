import { LoginForm } from "@/components/login-form";
export default function Login() {
  return (
    <main className="auth">
      <div className="brand">
        <span className="logo">✓</span>MaTache
      </div>
      <h1>Retrouvons vos clients.</h1>
      <p className="muted">Votre espace privé de suivi et de rappels.</p>
      <LoginForm />
    </main>
  );
}
