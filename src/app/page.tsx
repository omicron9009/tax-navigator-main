import { redirect } from "next/navigation";

export default function RootPage() {
  // Execute a server-side 307 Temporary Redirect (or 308 Permanent)
  redirect("/landing");
}
