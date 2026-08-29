/**
 * Exercises signup, login, history and logout against a running server and a
 * real Atlas connection. Checks the security properties that matter more than
 * the happy path: passwords are never stored or echoed in the clear, one
 * account cannot read another's history, and a logged-out token stops working.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const stamp = Date.now().toString(36);
const alice = { username: `alice_${stamp}`, password: "correct horse battery" };
const mallory = { username: `mallory_${stamp}`, password: "another long secret" };

const problems = [];
function check(condition, message) {
  if (!condition) problems.push(message);
}

function cookieFrom(response) {
  const header = response.headers.get("set-cookie") ?? "";
  return header.split(";")[0];
}

async function post(path, body, cookie) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  return { response, body: await response.json() };
}

async function get(path, cookie) {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
  });
  return { response, body: await response.json() };
}

console.log("\n=== Auth check ===\n");

// Signup
const signup = await post("/api/auth/signup", alice);
check(signup.body.success === true, `signup failed: ${JSON.stringify(signup.body)}`);
const aliceCookie = cookieFrom(signup.response);
check(aliceCookie.startsWith("lg_session="), "signup did not set a session cookie");
check(
  (signup.response.headers.get("set-cookie") ?? "").toLowerCase().includes("httponly"),
  "session cookie is readable by scripts (missing HttpOnly)",
);
check(
  !JSON.stringify(signup.body).includes(alice.password),
  "the password came back in the signup response",
);
console.log(`signed up ${alice.username}`);

// Duplicate username
const dupe = await post("/api/auth/signup", alice);
check(dupe.body.reason === "taken", "a duplicate username was allowed");

// Weak password
const weak = await post("/api/auth/signup", { username: `weak_${stamp}`, password: "short" });
check(weak.body.success === false, "an 8-character minimum was not enforced");

// Wrong password
const wrong = await post("/api/auth/login", { ...alice, password: "not it" });
check(wrong.body.success === false, "a wrong password was accepted");
check(
  wrong.body.reason === "credentials",
  "a wrong password gave a different answer than an unknown user",
);

// Unknown user gives the identical answer, so the form cannot enumerate names
const unknown = await post("/api/auth/login", { username: `ghost_${stamp}`, password: "whatever" });
check(
  unknown.body.reason === wrong.body.reason,
  "an unknown username is distinguishable from a wrong password",
);

// Save history
const history = {
  language: "my",
  context: { profile: { age: 42 }, lifeEvents: [], commitments: [], risks: [], completedActions: [], unknownImportantInformation: [], lastUpdatedAt: new Date().toISOString() },
  turns: [{ id: "t1", kind: "analyze", userText: "အလုပ်ကထွက်လိုက်ရတယ်", assistantText: "…", riskMoves: [], changes: [], pending: false, failed: false }],
  action: null,
  summary: null,
  simulation: null,
  title: "အလုပ်ကထွက်လိုက်ရတယ်",
  answered: 1,
};
const saved = await fetch(`${BASE}/api/account/history`, {
  method: "PUT",
  headers: { "content-type": "application/json", cookie: aliceCookie },
  body: JSON.stringify(history),
});
check(saved.ok, "history could not be saved");

const mine = await get("/api/account/history", aliceCookie);
check(mine.body.history?.turns?.[0]?.userText === "အလုပ်ကထွက်လိုက်ရတယ်", "history did not come back");
check(mine.body.history?.language === "my", "language was not preserved with the history");
console.log("history saved and read back");

// A second account must not see it
const other = await post("/api/auth/signup", mallory);
const otherCookie = cookieFrom(other.response);
const theirs = await get("/api/account/history", otherCookie);
check(theirs.body.history === null, "one account could read another's history");
console.log("history is isolated per account");

// Naming someone else in the body must not redirect the write. The account is
// resolved from the cookie alone.
await fetch(`${BASE}/api/account/history`, {
  method: "PUT",
  headers: { "content-type": "application/json", cookie: otherCookie },
  body: JSON.stringify({
    username: alice.username,
    usernameLower: alice.username.toLowerCase(),
    accountId: alice.username,
    conversations: [{ id: "x", title: "overwritten by mallory" }],
  }),
});
const untouched = await get("/api/account/history", aliceCookie);
check(
  untouched.body.history?.turns?.[0]?.userText === "အလုပ်ကထွက်လိုက်ရတယ်",
  "another account overwrote this history by naming it in the request body",
);
console.log("the request body cannot redirect a write to another account");

// No cookie, no history
const anonymous = await get("/api/account/history");
check(anonymous.response.status === 401, "history was served without a session");

// A made-up token is not a session
const forged = await get("/api/account/history", "lg_session=" + "a".repeat(64));
check(forged.response.status === 401, "a forged session token was accepted");

// Logout invalidates the token server-side
await post("/api/auth/logout", {}, aliceCookie);
const afterLogout = await get("/api/auth/me", aliceCookie);
check(afterLogout.body.account === null, "the token still worked after logging out");
console.log("logout invalidates the token server-side");

// And logging back in still finds the history
const back = await post("/api/auth/login", alice);
check(back.body.success === true, "could not log back in");
const restored = await get("/api/account/history", cookieFrom(back.response));
check(restored.body.history?.answered === 1, "history did not survive a logout and login");
console.log("history survives logout and login");

console.log("");
if (problems.length) {
  console.log("FAIL");
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}
console.log("PASS");
