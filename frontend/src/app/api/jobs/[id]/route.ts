import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/server/job-queue";

// GET /api/jobs/:id — poll job status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json(job);
}
