import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function failure(e: unknown, status = 400) {
  const message =
    e instanceof ZodError
      ? "Datos no válidos: " +
        e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
      : e instanceof Error
        ? e.message
        : "Error inesperado";
  return NextResponse.json({ error: message }, { status });
}
export function localMutation(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const loopback = ["localhost", "127.0.0.1", "[::1]"];
  if (!loopback.includes(url.hostname))
    throw new Error("Esta aplicación solo admite uso local.");
  if (origin) {
    const source = new URL(origin);
    if (!loopback.includes(source.hostname) || source.port !== url.port)
      throw new Error("Origen no permitido.");
  }
}
