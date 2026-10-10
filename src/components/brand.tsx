import { Check } from "lucide-react";

export function Brand() {
  return (
    <span className="brand">
      <span className="logo" aria-hidden="true">
        <Check size={23} strokeWidth={3} />
      </span>
      <span>
        Ma<span className="brand-accent">Tache</span>
      </span>
    </span>
  );
}
