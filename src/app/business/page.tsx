import { redirect } from "next/navigation";

// The legacy "business gifting" marketing page is discontinued. SealTheDay
// is now a wedding-vault product; corporate gifting is no longer the
// primary motion. Auth-gated business/* sub-routes remain accessible for
// existing accounts but are no longer surfaced publicly.
export default function BusinessPage() {
  redirect("/wedding");
}
