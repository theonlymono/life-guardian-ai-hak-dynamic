import { z } from "zod";
import { json, readJson } from "@/lib/api/http";
import { login } from "@/lib/auth/accounts";
import { setSessionCookie } from "@/lib/auth/cookie";

const schema = z.object({
  username: z.string().trim().min(1).max(30),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request): Promise<Response> {
  const parsed = schema.safeParse(await readJson(request));
  // A malformed body is answered exactly like a wrong password, so the shape
  // of the response never hints at which part was wrong.
  if (!parsed.success) {
    return json({ success: false, reason: "credentials" as const }, 401);
  }

  const result = await login(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    return json(
      { success: false, reason: result.reason },
      result.reason === "unavailable" ? 503 : 401,
    );
  }

  await setSessionCookie(result.token);
  return json({ success: true, username: result.username });
}
