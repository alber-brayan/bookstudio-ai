export async function GET() {
  return Response.json({ app: "bookstudio-ai", version: "0.1.0", local: true });
}
