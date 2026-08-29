import { cookies } from "next/headers";

export const SESSION_COOKIE = "lg_session";

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * httpOnly keeps the token out of reach of any script on the page, so an XSS
 * bug cannot walk away with someone's session. sameSite=lax stops another site
 * from riding the cookie on a cross-site request.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
