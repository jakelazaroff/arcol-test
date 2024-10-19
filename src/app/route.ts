import { redirect, RedirectType } from "next/navigation";

export function GET() {
  redirect(`/${crypto.randomUUID()}`, RedirectType.replace);
}
