import { NextResponse } from "next/server";
export async function POST(req: Request) {
  return NextResponse.redirect(
    new URL("/import?share=unsupported", req.url),
    303,
  );
}
