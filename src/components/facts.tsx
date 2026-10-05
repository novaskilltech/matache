import { fieldLabels } from "@/lib/domain/field-labels";
export function Facts({ data }: { data: Record<string, unknown> }) {
  const values = Object.entries(data).filter(
    ([, v]) =>
      v !== null &&
      v !== undefined &&
      v !== "" &&
      (!Array.isArray(v) || v.length),
  );
  return values.length ? (
    <div>
      {values.map(([k, v]) => (
        <div className="field" key={k}>
          <small>{fieldLabels[k] || k}</small>
          <span>
            {typeof v === "boolean"
              ? v
                ? "Oui"
                : "Non"
              : Array.isArray(v)
                ? v.join(", ")
                : typeof v === "object"
                  ? JSON.stringify(v)
                  : String(v)}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className="muted">Aucune information confirmée.</p>
  );
}
