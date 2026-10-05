"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ListTodo, Plus, Users } from "lucide-react";
export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Navigation principale">
      {[
        { href: "/", label: "Accueil", Icon: House },
        { href: "/actions", label: "Actions", Icon: ListTodo },
        { href: "/import", label: "Ajouter", Icon: Plus },
        { href: "/clients", label: "Clients", Icon: Users },
      ].map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`${path === href ? "active" : ""} ${href === "/import" ? "add" : ""}`}
        >
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
