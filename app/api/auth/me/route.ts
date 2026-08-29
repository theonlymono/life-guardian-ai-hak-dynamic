import { json } from "@/lib/api/http";
import { accountForToken } from "@/lib/auth/accounts";
import { readSessionCookie } from "@/lib/auth/cookie";

export async function GET(): Promise<Response> {
  const account = await accountForToken(await readSessionCookie());
  return json({ success: true, account });
}
