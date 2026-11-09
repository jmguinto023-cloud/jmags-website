// ops-booking-intake: receives the customer booking form and files it for the dashboard.
// Public (customers have no login), so it protects itself: it rebuilds the booking from scratch and rejects anything
// odd (hidden "website" field filled, form sent in under 3 seconds, bad map pin, past date, too many tries).
// The booking is stored in the exact "Label: value" shape the dashboard already reads.
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ---PURE-START---
const AREAS = ["Laguna", "Cavite", "Batangas", "Manila", "Quezon", "Other"];
const APPLIANCES = ["TV", "Washing machine", "Aircon", "Microwave", "Oven", "Electric fan", "Rice cooker", "Other"];
const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
const PRIORITY_FEE = 1000;
const CHECKUP = 1000;
const pinOk = (u: string) => /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|(www\.)?waze\.com\/(ul|live-map|[a-z-]+\/live-map)|ul\.waze\.com)/i.test(u);
function extractPin(t: string) {
  t = String(t || "").trim(); if (!t) return "";
  const cc = t.match(/^(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})$/); if (cc) return "https://www.google.com/maps?q=" + cc[1] + "," + cc[2];
  const u = t.match(/https?:\/\/[^\s]+/i); if (u) return u[0].replace(/[),.]+$/, "");
  const c = t.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/); if (c) return "https://www.google.com/maps?q=" + c[1] + "," + c[2];
  return "";
}
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
function mobile(raw: unknown): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("63") && d.length === 12) d = "0" + d.slice(2);
  else if (d.startsWith("9") && d.length === 10) d = "0" + d;
  return /^09\d{9}$/.test(d) ? d : "";
}
const manilaToday = (ms: number) => new Date(ms + 8 * 3600_000).toISOString().slice(0, 10);
// the form sends the date as yyyy-mm-dd; the dashboard reads it back as M/D/YY
function shortDate(iso: string) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return ""; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return ""; return `${+m[2]}/${+m[3]}/${String(m[1]).slice(2)}`; }

function build(body: any, nowMs: number): { data?: any; errors?: string[]; spam?: boolean } {
  const errors: string[] = [];
  const spam = !!clean(body.website, 50) || (Number(body.t) >= 0 && Number(body.t) < 3000);
  const name = clean(body.name, 80); if (name.length < 2) errors.push("name");
  const mob = mobile(body.mobile); if (!mob) errors.push("mobile");
  const address = clean(body.address, 160); if (address.length < 3) errors.push("address");
  const subdivision = clean(body.subdivision, 80);
  const city = clean(body.city, 60); if (city.length < 2) errors.push("city");
  const province = AREAS.includes(clean(body.province, 20)) ? clean(body.province, 20) : ""; if (!province) errors.push("province");
  const landmark = clean(body.landmark, 120); if (landmark.length < 2) errors.push("landmark");
  const pin = extractPin(clean(body.pin, 400)); if (!pin || !pinOk(pin)) errors.push("pin");
  const appliance = APPLIANCES.includes(clean(body.appliance, 30)) ? clean(body.appliance, 30) : ""; if (!appliance) errors.push("appliance");
  const brand = clean(body.brand, 40), size = clean(body.size, 20);
  if (!brand) errors.push("brand");
  if (!size) errors.push("size");
  const prior = clean(body.prior, 3) === "Yes" ? "Yes" : clean(body.prior, 3) === "No" ? "No" : ""; if (!prior) errors.push("prior");
  const problem = clean(body.problem, 400); if (problem.length < 3) errors.push("problem");
  const iso = clean(body.pdate, 10), pdate = shortDate(iso);
  if (!pdate || iso < manilaToday(nowMs)) errors.push("pdate");
  const ptime = TIMES.includes(clean(body.ptime, 10)) ? clean(body.ptime, 10) : "";
  const wait = body.willingToWait;
  if (wait !== undefined && wait !== "yes" && wait !== "no") errors.push("willingToWait");
  const prio = wait !== undefined ? wait === "no" : clean(body.service, 20).toUpperCase() === "PRIORITY";
  const typed = Math.round(Number(String(body.price ?? "").replace(/[^\d.]/g, ""))) || 0;
  const base = typed || CHECKUP;
  if (base < CHECKUP || base > 500000) errors.push("price");
  const price = base > 0 ? base + (prio ? PRIORITY_FEE : 0) : 0;
  const service = prio ? "PRIORITY (+\u20B11,000)" : "REGULAR";
  if (errors.length) return { errors, spam };
  const lines = [`Name: ${name}`, `Mobile: ${mob}`, `Address: ${address}`, `Subdivision: ${subdivision}`, `Town/City: ${city}`, `Province: ${province}`, `Landmark: ${landmark}`,
    `Map pin: ${pin}`, `Appliance: ${appliance}`, `Brand: ${brand}`, `Size: ${size}`, `Problem: ${problem}`, `Preferred date: ${pdate}`, wait ? `Willing to wait: ${wait}` : `Preferred time: ${ptime}`,
    `Service type: ${service}`, `Agreed price: ${price || ""}`, `Repaired before by someone else: ${prior}`];
  // Advertising measurement is strictly opt-in. Existing booking fields stay unchanged.
  // The live booking form must provide a clear, optional consent checkbox.
  const marketingConsent = body.marketingConsent === true;
  const candidateFbp = clean(body.fbp, 220);
  const candidateFbc = clean(body.fbc, 220);
  const fbp = marketingConsent && /^fb\.[\w.-]{8,200}$/.test(candidateFbp) ? candidateFbp : "";
  const fbc = marketingConsent && /^fb\.[\w.-]{8,200}$/.test(candidateFbc) ? candidateFbc : "";
  const marketingFields = marketingConsent
    ? { marketingConsent: true, marketingConsentAt: new Date(nowMs).toISOString(), ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) }
    : {};
  return { spam, data: { name, mobile: mob, address, subdivision, city, province, landmark, pin, appliance, brand, size, problem, pdate, ptime, ...(wait ? { willingToWait: wait } : {}), service, prior, price: price || "", details: lines.join("\n"), ...marketingFields } };
}
// ---PURE-END---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { ok: false });
  const raw = await req.text(); if (raw.length > 12000) return json(413, { ok: false, errors: ["too big"] });
  let body: any; try { body = JSON.parse(raw); } catch { return json(400, { ok: false, errors: ["bad request"] }); }
  const now = Date.now(), r = build(body || {}, now);
  // User agent is only retained if the customer opted into advertising measurement.
  if (r.data?.marketingConsent) r.data.clientUserAgent = clean(req.headers.get("user-agent"), 240);
  if (!r.data) return json(400, { ok: false, errors: r.errors });
  if (r.spam) return json(200, { ok: true });
  const hourAgo = new Date(now - 3600_000).toISOString(), tenMin = new Date(now - 600_000).toISOString();
  const { data: same } = await sb.from("form_submissions").select("id,data").eq("form_name", "booking").gte("created_at", tenMin).eq("data->>mobile", r.data.mobile).limit(5);
  const existing = (same || []).find((x: any) => x.data?.problem === r.data.problem && x.data?.pdate === r.data.pdate && (!r.data.willingToWait || x.data?.willingToWait === r.data.willingToWait));
  if (existing) return json(200, { ok: true, bookingId: existing.id });
  const { count: perPhone } = await sb.from("form_submissions").select("id", { count: "exact", head: true }).eq("data->>mobile", r.data.mobile).gte("created_at", hourAgo);
  if ((perPhone || 0) >= 3) return json(429, { ok: false, errors: ["too many"] });
  const { count: perDay } = await sb.from("form_submissions").select("id", { count: "exact", head: true }).gte("created_at", new Date(now - 86400_000).toISOString());
  if ((perDay || 0) >= 300) return json(429, { ok: false, errors: ["busy"] });
  const { data: saved, error } = await sb.from("form_submissions").insert({ form_name: "booking", data: r.data, source: "form" }).select("id").single();
  if (error) return json(500, { ok: false, errors: ["could not save"] });
  return json(200, { ok: true, bookingId: saved.id });
});

