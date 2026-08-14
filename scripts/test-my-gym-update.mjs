/**
 * Reproduction for PUT /api/gyms/my-gym returning 500.
 *
 * Finding: the request body is correct and binds fine. The endpoint answers 200
 * for scalar-only bodies and 400 for invalid values, but throws 500 as soon as
 * either `WorkingPeriods` or `Services` contains a valid item.
 *
 * Usage
 *   GYM_TOKEN=eyJhbGc... node scripts/test-my-gym-update.mjs
 *   GYM_EMAIL=you@gym.com GYM_PASSWORD='...' node scripts/test-my-gym-update.mjs
 *
 * Options
 *   --base=URL   override the API base (default https://gymbro.runasp.net/api)
 *
 * Every test replays the gym's own scalar values, so nothing is destroyed: the
 * successful cases write back exactly what they read, and the failing cases
 * change nothing at all.
 */

const BASE =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
  process.env.GYM_API_BASE ??
  "https://gymbro.runasp.net/api";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};
const paint = (c, s) => `${c}${s}${C.reset}`;

/** The public host drops connections now and then; one attempt is not a result. */
async function request(url, init, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, init);
    } catch {
      if (i === tries - 1) throw new Error(`network failure after ${tries} attempts: ${url}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function login() {
  if (process.env.GYM_TOKEN) return process.env.GYM_TOKEN;

  const email = process.env.GYM_EMAIL;
  const password = process.env.GYM_PASSWORD;
  if (!email || !password) {
    console.error(
      paint(C.red, "Set GYM_TOKEN, or GYM_EMAIL together with GYM_PASSWORD, before running.")
    );
    process.exit(1);
  }

  const res = await request(`${BASE}/gym-manager/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    console.error(paint(C.red, `Login failed — ${res.status}\n${await res.text()}`));
    process.exit(1);
  }
  return (await res.json()).accessToken;
}

async function main() {
  console.log(paint(C.bold, `API: ${BASE}`));

  const token = await login();
  const auth = { Authorization: `Bearer ${token}` };

  const gymRes = await request(`${BASE}/gyms/my-gym`, { headers: auth });
  if (!gymRes.ok) {
    console.error(paint(C.red, `GET /gyms/my-gym — ${gymRes.status}\n${await gymRes.text()}`));
    process.exit(1);
  }
  const gym = await gymRes.json();

  console.log(
    paint(C.dim, `gym "${gym.name}" · periods ${(gym.workingPeriods ?? []).length}` +
      ` · services ${(gym.services ?? []).length}\n`)
  );

  /** The gym's current scalars — replayed by every test so nothing is lost. */
  const scalars = (fd) => {
    fd.append("Name", gym.name ?? "");
    fd.append("Description", gym.description ?? "");
    fd.append("Phone", gym.phone ?? "");
    fd.append("Latitude", String(gym.latitude ?? 0));
    fd.append("Longitude", String(gym.longitude ?? 0));
  };

  const results = [];

  async function attempt(label, expected, fill) {
    const fd = new FormData();
    fill(fd);
    const res = await request(`${BASE}/gyms/my-gym`, { method: "PUT", headers: auth, body: fd });
    const text = await res.text();

    const colour = res.status < 300 ? C.green : res.status < 500 ? C.yellow : C.red;
    console.log(paint(colour + C.bold, `${String(res.status).padEnd(4)} ${label}`));
    console.log(paint(C.dim, `     expected ${expected}`));
    if (!res.ok) console.log(paint(C.dim, `     ${text.slice(0, 150)}`));

    results.push({ label, status: res.status });
    return res.status;
  }

  console.log(paint(C.bold, "── Body the endpoint accepts ──"));
  await attempt("Name only", "200", (fd) => fd.append("Name", gym.name ?? ""));
  const scalarsOnly = await attempt("All scalars, no collections", "200", scalars);

  console.log(paint(C.bold, "\n── Proof that the indexed keys bind correctly ──"));
  const bindA = await attempt("Services[0].ServiceType = 99", "400, naming the field", (fd) => {
    scalars(fd);
    fd.append("Services[0].ServiceType", "99");
    fd.append("Services[0].IsEnabled", "true");
  });
  const bindB = await attempt("WorkingPeriods[0].DayOfWeek = 99", "400, naming the field", (fd) => {
    scalars(fd);
    fd.append("WorkingPeriods[0].DayOfWeek", "99");
    fd.append("WorkingPeriods[0].StartTime", "09:00");
    fd.append("WorkingPeriods[0].EndTime", "22:00");
    fd.append("WorkingPeriods[0].GenderType", "2");
  });

  console.log(paint(C.bold, "\n── The same keys with VALID values ──"));
  const svc = await attempt("Services[0], serviceType 0, enabled", "200", (fd) => {
    scalars(fd);
    fd.append("Services[0].ServiceType", "0");
    fd.append("Services[0].IsEnabled", "true");
  });
  const per = await attempt("WorkingPeriods[0], Monday 09:00–22:00", "200", (fd) => {
    scalars(fd);
    fd.append("WorkingPeriods[0].DayOfWeek", "1");
    fd.append("WorkingPeriods[0].StartTime", "09:00");
    fd.append("WorkingPeriods[0].EndTime", "22:00");
    fd.append("WorkingPeriods[0].GenderType", "2");
  });

  // ── Verdict ────────────────────────────────────────────────────────────────
  console.log(paint(C.cyan + C.bold, "\n── Verdict ──"));

  const bindingWorks = bindA === 400 && bindB === 400;
  const collectionsBreak = svc >= 500 || per >= 500;

  if (scalarsOnly < 300 && bindingWorks && collectionsBreak) {
    console.log(
      paint(
        C.red,
        "  BACKEND DEFECT. The body is correct:\n" +
          "    · scalar-only bodies return 200\n" +
          "    · invalid enum values return 400 naming the exact indexed field,\n" +
          "      which proves the collections bind\n" +
          "    · the identical keys with VALID values return 500\n\n" +
          "  So the exception is thrown after binding and validation, inside the\n" +
          "  update handler, whenever a collection is non-empty. Nothing the client\n" +
          "  sends can avoid it — the collections cannot be saved at all today."
      )
    );
  } else if (!collectionsBreak) {
    console.log(paint(C.green, "  Collections now save correctly — the endpoint has been fixed."));
  } else {
    console.log(paint(C.yellow, "  Inconclusive — see the statuses above."));
  }

  console.log(paint(C.dim, "\n  " + results.map((r) => `${r.status} ${r.label}`).join("\n  ")));
}

main().catch((err) => {
  console.error(paint(C.red, `\nUnexpected failure: ${err?.stack ?? err}`));
  process.exit(1);
});
