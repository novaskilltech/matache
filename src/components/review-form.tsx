"use client";
import { fieldLabels } from "@/lib/domain/field-labels";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  type AnalysisResult,
  manualResult,
  analysisResultSchema,
} from "@/lib/ai/schema";
import type { Client } from "@/lib/domain/models";
import {
  categories,
  labels,
  priorities,
  priorityLabels,
  owners,
} from "@/lib/domain/models";
import { matchClient, normalizePhone, phoneCountry } from "@/lib/domain/phone";
import {
  correctedField,
  lowConfidenceGroups,
  groupLabels,
  changeReviewCategory,
} from "@/lib/domain/review";
import { Facts } from "./facts";
const responseSchema = z.object({ actionId: z.string().uuid() });
export function ReviewForm({
  initial,
  analysisId,
  clients,
  manual = false,
}: {
  initial: AnalysisResult | null;
  analysisId: string;
  clients: Client[];
  manual?: boolean;
}) {
  const router = useRouter();
  const [result, setResult] = useState(initial ?? manualResult()),
    [editing, setEditing] = useState(!initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [country, setCountry] = useState("FR"),
    [chosen, setChosen] = useState(""),
    [ack, setAck] = useState(false);
  const match = matchClient(
    clients,
    result.client.phone,
    result.client.name,
    phoneCountry(country),
  );
  const low = lowConfidenceGroups(result);
  function field(group: keyof AnalysisResult, key: string, value: unknown) {
    setResult((r) => correctedField(r, group, key, value));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const parsed = analysisResultSchema.parse(result);
      const r = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          result: parsed,
          clientId: chosen || match.exact?.id || null,
          country,
          manual,
        }),
      });
      if (!r.ok) throw new Error();
      const { actionId } = responseSchema.parse(await r.json());
      router.push("/actions/" + actionId);
      router.refresh();
    } catch {
      setError("Validation impossible. Vérifiez les données ou réessayez.");
      setBusy(false);
    }
  }
  async function ignore() {
    setBusy(true);
    const r = await fetch("/api/analyses/" + analysisId + "/ignore", {
      method: "POST",
    });
    if (r.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Impossible d’ignorer ce dossier.");
      setBusy(false);
    }
  }
  return (
    <form className="stack" onSubmit={submit}>
      <section className="card">
        <div className="row between">
          <span className="badge">
            {initial ? "ACTION DÉTECTÉE" : "SAISIE MANUELLE"}
          </span>
          <button
            type="button"
            className="secondary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Revenir au résumé" : "Modifier"}
          </button>
        </div>
        <h2>{result.action.title}</h2>
        <p>
          {result.client.name ||
            normalizePhone(result.client.phone, phoneCountry(country)) ||
            "Client à identifier"}
        </p>
        <div className="row">
          <span className="badge">{labels[result.action.category]}</span>
          <span className="badge">
            {priorityLabels[result.action.priority]}
          </span>
        </div>
        <p className="muted">
          {result.request.summary ||
            result.action.description ||
            "Précisez le contexte si nécessaire."}
        </p>
        {match.exact && (
          <p className="notice">
            Téléphone reconnu : cette action sera ajoutée à{" "}
            {match.exact.name || "votre client existant"}.
          </p>
        )}
        {!match.exact && match.candidates.length > 0 && (
          <div className="notice">
            <p>
              Un nom similaire existe. Choisissez un dossier uniquement si vous
              confirmez l’identité.
            </p>
            <select
              aria-label="Confirmer un dossier existant"
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
            >
              <option value="">Créer un nouveau client</option>
              {match.candidates.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name} · {c.phone_normalized || "sans téléphone"}
                </option>
              ))}
            </select>
          </div>
        )}
        {result.client.phone && !match.phone && (
          <p className="error">
            Téléphone non reconnu. Corrigez le numéro ou le pays avant de
            valider.
          </p>
        )}
        {low.length > 0 && (
          <p className="notice">
            À vérifier : {low.map((g) => groupLabels[g]).join(", ")}.
          </p>
        )}
        {result.warnings.length > 0 && (
          <div className="notice">
            <p>Points à confirmer :</p>
            <ul>
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <label className="row">
              <input
                style={{ width: 18 }}
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              J’ai vérifié ces points.
            </label>
          </div>
        )}
        {editing && (
          <>
            <label htmlFor="name">Client</label>
            <input
              id="name"
              value={result.client.name ?? ""}
              onChange={(e) => field("client", "name", e.target.value || null)}
            />
            <label htmlFor="phone">Téléphone</label>
            <div className="row">
              <select
                aria-label="Pays du numéro local"
                style={{ width: "auto" }}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="FR">France (+33)</option>
                <option value="MA">Maroc (+212)</option>
                <option value="SA">Arabie saoudite (+966)</option>
                <option value="BE">Belgique (+32)</option>
                <option value="ES">Espagne (+34)</option>
              </select>
              <input
                id="phone"
                type="tel"
                style={{ flex: 1 }}
                value={result.client.phone ?? ""}
                onChange={(e) =>
                  field("client", "phone", e.target.value || null)
                }
              />
            </div>
            <label htmlFor="title">Prochaine action</label>
            <input
              id="title"
              required
              maxLength={240}
              value={result.action.title}
              onChange={(e) => field("action", "title", e.target.value)}
            />
            <label htmlFor="category">Catégorie</label>
            <select
              id="category"
              value={result.action.category}
              onChange={(e) => {
                const category = e.target
                  .value as AnalysisResult["action"]["category"];
                setResult((r) => changeReviewCategory(r, category));
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {labels[c]}
                </option>
              ))}
            </select>
            <label htmlFor="priority">Priorité</label>
            <select
              id="priority"
              value={result.action.priority}
              onChange={(e) => field("action", "priority", e.target.value)}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {priorityLabels[p]}
                </option>
              ))}
            </select>
            <label htmlFor="owner">Qui doit agir ?</label>
            <select
              id="owner"
              value={result.request.action_owner}
              onChange={(e) => field("request", "action_owner", e.target.value)}
            >
              {owners.map((p, i) => (
                <option key={p} value={p}>
                  {["Vous", "Client", "Prestataire"][i]}
                </option>
              ))}
            </select>
            <label htmlFor="description">Description / contexte</label>
            <textarea
              id="description"
              rows={3}
              value={result.action.description}
              onChange={(e) => field("action", "description", e.target.value)}
            />
          </>
        )}
        {editing && (
          <details style={{ marginTop: 18 }}>
            <summary>Corriger les informations du dossier</summary>
            {(["travel", "documents", "financial"] as const).map((group) => (
              <fieldset
                key={group}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  marginTop: 16,
                  padding: 14,
                }}
              >
                <legend>{groupLabels[group]}</legend>
                {Object.entries(result[group]).map(([key, value]) => (
                  <label key={key}>
                    {fieldLabels[key] || key}
                    {Array.isArray(value) ? (
                      <input
                        value={value.join(", ")}
                        onChange={(e) =>
                          field(
                            group,
                            key,
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    ) : typeof value === "boolean" ||
                      key.endsWith("_received") ? (
                      <select
                        value={value === null ? "" : String(value)}
                        onChange={(e) =>
                          field(
                            group,
                            key,
                            e.target.value === ""
                              ? null
                              : e.target.value === "true",
                          )
                        }
                      >
                        <option value="">Non renseigné</option>
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                      </select>
                    ) : (
                      <input
                        type={
                          key.includes("amount") ||
                          ["adults", "children", "travelers_total"].includes(
                            key,
                          )
                            ? "number"
                            : key.endsWith("_date")
                              ? "date"
                              : "text"
                        }
                        min="0"
                        step={key.includes("amount") ? "0.01" : "1"}
                        value={value === null ? "" : String(value)}
                        onChange={(e) =>
                          field(
                            group,
                            key,
                            e.target.value === ""
                              ? null
                              : key.includes("amount") ||
                                  [
                                    "adults",
                                    "children",
                                    "travelers_total",
                                  ].includes(key)
                                ? Number(e.target.value)
                                : e.target.value,
                          )
                        }
                      />
                    )}
                  </label>
                ))}
              </fieldset>
            ))}
          </details>
        )}
      </section>
      {!editing &&
        (["travel", "documents", "financial"] as const)
          .filter((g) =>
            Object.values(result[g]).some(
              (v) =>
                v !== null && v !== "" && (!Array.isArray(v) || v.length > 0),
            ),
          )
          .map((g) => (
            <section className="card" key={g}>
              <h2>{groupLabels[g]}</h2>
              <Facts data={result[g]} />
            </section>
          ))}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        <button
          disabled={
            busy ||
            (result.warnings.length > 0 && !ack) ||
            (Boolean(result.client.phone) && !match.phone)
          }
          style={{ flex: 1 }}
        >
          {busy ? "Enregistrement…" : "VALIDER"}
        </button>
        {!manual && (
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={ignore}
          >
            Ignorer
          </button>
        )}
      </div>
    </form>
  );
}
