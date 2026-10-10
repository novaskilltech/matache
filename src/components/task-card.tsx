import Link from "next/link";
import {
  Phone,
  FileText,
  Clock,
  Plane,
  ArrowUpRight,
  ListTodo,
  Map,
} from "lucide-react";
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
          : a.category === "OMRA_INFO"
            ? Plane
            : a.category === "TRIP_SUMMARY"
              ? Map
              : ListTodo;
  const overdue = isOverdue(a);
  return (
    <Link
      className={`card task task-${a.category.toLowerCase()} ${overdue ? "task-overdue" : ""}`}
      href={"/actions/" + a.id}
    >
      <div className="task-icon" aria-hidden="true">
        <Icon size={21} />
      </div>
      <div className="task-body">
        <div className="row between">
          <span className="task-client">
            {client?.name || client?.phone_normalized || "Client à identifier"}
          </span>
          <span
            className={
              "badge " +
              (a.priority === "URGENT" || overdue
                ? "urgent"
                : a.priority === "TODAY"
                  ? "today"
                  : "neutral")
            }
          >
            {overdue ? "EN RETARD" : priorityLabels[a.priority]}
          </span>
        </div>
        <h3>{a.title}</h3>
        {a.description && <p className="task-description">{a.description}</p>}
        <div className="task-meta">
          <span className="category-tag">{labels[a.category]}</span>
          <span className="task-status">
            <span className={`status-dot status-${a.status.toLowerCase()}`} />
            {statusLabels[a.status]}
          </span>
          <span className={overdue ? "due-overdue" : ""}>
            <Clock size={13} aria-hidden="true" />
            {dateLabel(a.due_at)}
          </span>
        </div>
      </div>
      <ArrowUpRight className="card-arrow" size={18} aria-hidden="true" />
    </Link>
  );
}
