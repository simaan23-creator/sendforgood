import { redirect } from "next/navigation";

// Physical-gift checkout is discontinued. Existing customers continue to
// manage previously-purchased credits via /gifts/assign (auth-protected);
// new purchases route to the wedding vault.
export default function GiftsBuyPage() {
  redirect("/wedding");
}
