import Link from "next/link";
import { Phone, FileText, Clock, Plane } from "lucide-react";
import type { Action, Client } from "@/lib/domain/models";
import { labels, priorityLabels, statusLabels } from "@/lib/domain/models";
import { dateLabel, isOverdue } from "@/lib/domain/queue";
export function TaskCard({
  action: a,
  client,
}: {
  action: Action;
  client?: Client;
}) {
  const Icon =
    a.category === "INVOICE"
      ? FileText
      : a.category === "CALLBACK"
        ? Phone
        : a.category === "WAITING_CLIENT"
          ? Clock
          : Plane;
  return (
    <Link className="card task" href={"/actions/" + a.id}>
      <div className="task-icon">
        <Icon size={22} />
      </div>
      <div className="task-body">
        <div className="row between">
          <span className="muted">
            {client?.name || client?.phone_normalized || "Client à identifier"}
          </span>
          <span
            className={
              "badge " +
              (a.priority === "URGENT" || isOverdue(a) ? "urgent" : "")
            }
          >
            {isOverdue(a) ? "EN RETARD" : priorityLabels[a.priority]}
          </span>
        </div>
        <h3>{a.title}</h3>
        <p className="muted" style={{ fontSize: 13, margin: "6px 0 12px" }}>
          {a.description}
        </p>
        <div className="row muted" style={{ fontSize: 12 }}>
          <span>{labels[a.category]}</span>
          <span>· {statusLabels[a.status]}</span>
          <span>· {dateLabel(a.due_at)}</span>
        </div>
      </div>
    </Link>
  );
}
