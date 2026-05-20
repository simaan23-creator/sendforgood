import { redirect } from "next/navigation";

// Physical gifts have been discontinued. Send wedding-vault traffic
// (the active product) instead of leaving a dead landing page.
export default function GiftsPage() {
  redirect("/wedding");
}
