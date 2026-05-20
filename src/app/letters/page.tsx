import { redirect } from "next/navigation";

// Physical-letter marketing page is discontinued. Digital letters remain
// available via /messages/buy, but all top-funnel traffic routes to the
// wedding vault.
export default function LettersPage() {
  redirect("/wedding");
}
