import { json } from "@/lib/api/http";
import { endSession } from "@/lib/auth/accounts";
import { clearSessionCookie, readSessionCookie } from "@/lib/auth/cookie";

export async function POST(): Promise<Response> {
  const token = await readSessionCookie();
  // Deleted server-side as well as in the browser: a cookie the client throws
  // away is still a valid token to anyone who copied it.
  await endSession(token);
  await clearSessionCookie();
  return json({ success: true });
}
