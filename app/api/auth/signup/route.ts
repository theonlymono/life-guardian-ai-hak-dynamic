import { z } from "zod";
import { json, readJson } from "@/lib/api/http";
import { signup } from "@/lib/auth/accounts";
import { setSessionCookie } from "@/lib/auth/cookie";

const schema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request): Promise<Response> {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return json({ success: false, reason: "invalid" as const }, 400);
  }

  const result = await signup(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    return json(
      { success: false, reason: result.reason },
      result.reason === "unavailable" ? 503 : 400,
    );
  }

  await setSessionCookie(result.token);
  return json({ success: true, username: result.username });
}
