import { APP_VERSION } from "@/lib/version";

export async function GET() {
  return Response.json({
    app: "bookstudio-ai",
    version: APP_VERSION,
    local: true,
  });
}
