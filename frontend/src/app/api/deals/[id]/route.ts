import { NextRequest, NextResponse } from "next/server";
import { loadDeal, saveDeal, deleteDeal } from "@/lib/server/storage";

// GET /api/deals/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deal = await loadDeal(id);
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return NextResponse.json(deal);
}

// PUT /api/deals/:id — update deal metadata
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deal = await loadDeal(id);
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const updates = await req.json();
  const allowed = ["deal_name", "company", "stage", "notes", "owner", "assigned_to"];
  for (const key of allowed) {
    if (updates[key] !== undefined) deal[key] = updates[key];
  }
  deal.updated_at = new Date().toISOString();

  await saveDeal(id, deal);
  return NextResponse.json(deal);
}

// DELETE /api/deals/:id — delete deal and all its analyses
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteDeal(id);
  return NextResponse.json({ ok: true });
}
