"use client";
import { fieldLabels } from "@/lib/domain/field-labels";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/domain/models";
import { manualResult, type AnalysisResult } from "@/lib/ai/schema";
import { isConfigured } from "@/lib/config";
import { groupLabels } from "@/lib/domain/review";
export function ClientEditor({ client }: { client: Client }) {
  const router = useRouter();
  const initial = manualResult();
  const [name, setName] = useState(client.name || ""),
    [phone, setPhone] = useState(client.phone || ""),
    [country, setCountry] = useState("FR"),
    [values, setValues] = useState({
      travel: { ...initial.travel, ...client.travel },
      documents: { ...initial.documents, ...client.documents },
      financial: { ...initial.financial, ...client.financial },
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function field(
    g: "travel" | "documents" | "financial",
    key: string,
    value: unknown,
  ) {
    setValues((v) => ({ ...v, [g]: { ...v[g], [key]: value } }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/clients/" + client.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || null,
        phone: phone || null,
        country,
        ...values,
      }),
    });
    if (r.ok) {
      router.push("/clients/" + client.id);
      router.refresh();
    } else {
      setError(
        "Correction impossible. Vérifiez le téléphone et les informations.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="card" onSubmit={submit}>
      <label htmlFor="name">Nom</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="phone">Téléphone</label>
      <input
        id="phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <label htmlFor="country">Pays du numéro local</label>
      <select
        id="country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      >
        {[
          ["FR", "France"],
          ["MA", "Maroc"],
          ["SA", "Arabie saoudite"],
          ["BE", "Belgique"],
          ["ES", "Espagne"],
        ].map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {(["travel", "documents", "financial"] as const).map((g) => (
        <details key={g} style={{ marginTop: 20 }}>
          <summary>{groupLabels[g]}</summary>
          {Object.entries(values[g]).map(([key, value]) => (
            <label key={key}>
              {fieldLabels[key] || key}
              {Array.isArray(value) ? (
                <input
                  value={value.join(", ")}
                  onChange={(e) =>
                    field(
                      g,
                      key,
                      e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    )
                  }
                />
              ) : key.endsWith("_received") ? (
                <select
                  value={value === null ? "" : String(value)}
                  onChange={(e) =>
                    field(
                      g,
                      key,
                      e.target.value === "" ? null : e.target.value === "true",
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
                    ["adults", "children", "travelers_total"].includes(key)
                      ? "number"
                      : key.endsWith("_date")
                        ? "date"
                        : "text"
                  }
                  value={value === null ? "" : String(value)}
                  min="0"
                  step={key.includes("amount") ? "0.01" : "1"}
                  onChange={(e) =>
                    field(
                      g,
                      key,
                      e.target.value === ""
                        ? null
                        : key.includes("amount") ||
                            ["adults", "children", "travelers_total"].includes(
                              key,
                            )
                          ? Number(e.target.value)
                          : e.target.value,
                    )
                  }
                />
              )}
            </label>
          ))}
        </details>
      ))}
      {error && <p className="error">{error}</p>}
      <button disabled={busy || !isConfigured()} style={{ marginTop: 20 }}>
        Enregistrer les corrections
      </button>
    </form>
  );
}
