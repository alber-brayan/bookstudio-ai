import { NextResponse } from "next/server";
import { projectSchema } from "@/lib/schema";
import { getProject, listProjects, saveProject } from "@/server/storage";
import { failure, localMutation } from "@/server/http";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  return NextResponse.json(id ? getProject(id) : listProjects());
}
export async function POST(req: Request) {
  try {
    localMutation(req);
    const p = projectSchema.parse(await req.json());
    p.updatedAt = new Date().toISOString();
    saveProject(p);
    return NextResponse.json(p);
  } catch (e) {
    return failure(e);
  }
}
