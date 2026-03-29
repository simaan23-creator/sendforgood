import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function verifyShipmentAccess(
  shipmentId: string,
  userId: string | null
): Promise<boolean> {
  if (!userId) {
    // No authenticated user — allow (admin flow uses supabaseAdmin without auth)
    return true;
  }

  // Customer flow: verify the shipment belongs to an order owned by this user
  const { data, error } = await supabaseAdmin
    .from("shipments")
    .select("id, orders!inner(user_id)")
    .eq("id", shipmentId)
    .limit(1)
    .single();

  if (error || !data) return false;

  const order = data.orders as unknown as { user_id: string };
  return order.user_id === userId;
}

export async function POST(request: NextRequest) {
  try {
    // Try to get authenticated user (optional — admin doesn't have one)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const shipmentId = formData.get("shipment_id") as string | null;

    if (!file || !shipmentId) {
      return NextResponse.json(
        { error: "file and shipment_id are required" },
        { status: 400 }
      );
    }

    // If there's an authenticated user, verify they own this shipment
    if (user) {
      const hasAccess = await verifyShipmentAccess(shipmentId, user.id);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Shipment not found" },
          { status: 404 }
        );
      }
    }

    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `shipments/${shipmentId}/${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("shipment-photos")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("shipment-photos")
      .getPublicUrl(filePath);

    // Update shipment photo_url
    const { error: updateError } = await supabaseAdmin
      .from("shipments")
      .update({ photo_url: publicUrl })
      .eq("id", shipmentId);

    if (updateError) throw updateError;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Error uploading shipment photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { shipment_id: shipmentId } = await request.json();

    if (!shipmentId) {
      return NextResponse.json(
        { error: "shipment_id is required" },
        { status: 400 }
      );
    }

    // If there's an authenticated user, verify they own this shipment
    if (user) {
      const hasAccess = await verifyShipmentAccess(shipmentId, user.id);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Shipment not found" },
          { status: 404 }
        );
      }
    }

    // Clear the photo_url on the shipment
    const { error: updateError } = await supabaseAdmin
      .from("shipments")
      .update({ photo_url: null })
      .eq("id", shipmentId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing shipment photo:", error);
    return NextResponse.json(
      { error: "Failed to remove photo" },
      { status: 500 }
    );
  }
}
