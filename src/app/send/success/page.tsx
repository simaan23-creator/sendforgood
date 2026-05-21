import { redirect } from "next/navigation";

// Legacy success URL from the discontinued gift-sending flow. Anyone landing
// here is hitting a stale Stripe success_url. Send them to the dashboard,
// where active credits and any in-flight orders are visible.
export default function SendSuccessPage() {
  redirect("/dashboard");
}
