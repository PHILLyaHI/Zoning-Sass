// ============================================
// SNAPSHOT API ROUTE
// ============================================
// POST /api/snapshot — Generate a Risk Snapshot
// Integrates with existing geocode, zoning, soil services
// ============================================

import { NextResponse } from "next/server";
import { generateSnapshot } from "../../../lib/snapshotService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, userId, idempotencyKey } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // In production:
    // 1. Verify user auth token
    // 2. Check credit balance server-side
    // 3. Deduct credit atomically
    // 4. Run real data lookups (geocode, parcel, zoning, soil, env)
    // 5. Return snapshot result
    // 6. Record snapshot run

    // For now, use the mock snapshot generator
    const snapshot = generateSnapshot(address);

    return NextResponse.json({
      success: true,
      snapshot,
      creditDeducted: true,
      idempotencyKey,
    });
  } catch (error) {
    console.error("Snapshot API error:", error);
    return NextResponse.json(
      { error: "Failed to generate snapshot" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    );
  }

  // Preview mode — returns limited data without credit charge
  const snapshot = generateSnapshot(address);

  return NextResponse.json({
    preview: true,
    address: snapshot.address,
    city: snapshot.city,
    county: snapshot.county,
    zoningDistrict: snapshot.zoningDistrict,
    overallStatus: snapshot.overallStatus,
    // Don't return full data in preview
    buildability: { status: snapshot.buildability.status },
    utilities: { status: snapshot.utilities.status },
    environmental: { status: snapshot.environmental.status },
  });
}
