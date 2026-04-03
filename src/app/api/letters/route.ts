import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/letters — get all letters for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: letters, error } = await supabase
      .from("letters")
      .select("*, recipients(name, relationship, address_line1, city, state, postal_code)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ letters: letters || [] });
  } catch (error) {
    console.error("Error fetching letters:", error);
    return NextResponse.json(
      { error: "Failed to fetch letters" },
      { status: 500 }
    );
  }
}

// PATCH /api/letters — update a letter (content, title, scheduled_date, executor_email)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { letterId, title, content, scheduledDate, executorEmail } = body;

    if (!letterId) {
      return NextResponse.json(
        { error: "Letter ID is required" },
        { status: 400 }
      );
    }

    // Only allow editing if the letter hasn't been printed
    const { data: letter } = await supabase
      .from("letters")
      .select("status")
      .eq("id", letterId)
      .eq("user_id", user.id)
      .single();

    if (!letter) {
      return NextResponse.json(
        { error: "Letter not found" },
        { status: 404 }
      );
    }

    if (["printed", "delivered"].includes(letter.status)) {
      return NextResponse.json(
        { error: "This letter has already been printed and cannot be edited" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (scheduledDate !== undefined) updates.scheduled_date = scheduledDate;
    if (executorEmail !== undefined) updates.executor_email = executorEmail;

    const { data: updated, error } = await supabase
      .from("letters")
      .update(updates)
      .eq("id", letterId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ letter: updated });
  } catch (error) {
    console.error("Error updating letter:", error);
    return NextResponse.json(
      { error: "Failed to update letter" },
      { status: 500 }
    );
  }
}
