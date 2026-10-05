import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin)
    throw new HttpError(403, "Requête non autorisée");
}
export function apiError(error: unknown) {
  const status =
    error instanceof HttpError
      ? error.status
      : error instanceof ZodError
        ? 400
        : error instanceof Error && error.message === "Authentication required"
          ? 401
          : 503;
  return NextResponse.json(
    {
      error:
        status === 400
          ? "Données invalides"
          : status === 401
            ? "Connectez-vous à votre espace"
            : status === 403
              ? "Requête non autorisée"
              : status === 429
                ? "Limite temporaire atteinte. Réessayez dans une heure."
                : "Opération indisponible. Réessayez.",
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
