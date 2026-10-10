"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  ListTodo,
  Plus,
  Users,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";
const items = [
  { href: "/", label: "Accueil", Icon: House },
  { href: "/actions", label: "Actions", Icon: ListTodo },
  { href: "/import", label: "Ajouter", Icon: Plus },
  { href: "/clients", label: "Clients", Icon: Users },
];
export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Navigation principale">
      <div className="nav-heading">
        <Link href="/" aria-label="MaTache, accueil">
          <Brand />
        </Link>
        <p>Aucun client oublié.</p>
      </div>
      <span className="nav-caption">VOTRE ESPACE</span>
      <div className="nav-items">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? path === "/"
              : path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${active ? "active" : ""} ${href === "/import" ? "add" : ""}`}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="nav-footer">
        <Link
          href="/settings"
          aria-current={path === "/settings" ? "page" : undefined}
          className={path === "/settings" ? "active" : ""}
        >
          <Settings size={20} aria-hidden="true" />
          Paramètres
        </Link>
        <p>
          <ShieldCheck size={16} aria-hidden="true" /> Votre suivi, en privé.
        </p>
      </div>
    </nav>
  );
}
