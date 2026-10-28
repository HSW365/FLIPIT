/* FLIPIT Lead Hunter — free public-record lead engine.
   Source: county Sheriff foreclosure sale listings published at salesweb.civilview.com
   (public service pages run by each Sheriff's Office). No API key, no paid provider.
   Classifies each case: bank foreclosure, tax-lien foreclosure, HOA/condo lien foreclosure. */

const BASE = "https://salesweb.civilview.com";
const UA = "FLIPIT-LeadHunter/1.0 (+https://flipit-m5ig.onrender.com)";
const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

const COUNTIES = {
  // New Jersey
  "atlantic-nj": { id: 25, name: "Atlantic County, NJ" },
  "bergen-nj": { id: 7, name: "Bergen County, NJ" },
  "burlington-nj": { id: 3, name: "Burlington County, NJ" },
  "camden-nj": { id: 1, name: "Camden County, NJ" },
  "capemay-nj": { id: 52, name: "Cape May County, NJ" },
  "cumberland-nj": { id: 6, name: "Cumberland County, NJ" },
  "essex-nj": { id: 2, name: "Essex County, NJ" },
  "gloucester-nj": { id: 19, name: "Gloucester County, NJ" },
  "hudson-nj": { id: 10, name: "Hudson County, NJ" },
  "hunterdon-nj": { id: 32, name: "Hunterdon County, NJ" },
  "middlesex-nj": { id: 73, name: "Middlesex County, NJ" },
  "monmouth-nj": { id: 8, name: "Monmouth County, NJ" },
  "morris-nj": { id: 9, name: "Morris County, NJ" },
  "ocean-nj": { id: 85, name: "Ocean County, NJ" },
  "passaic-nj": { id: 17, name: "Passaic County, NJ" },
  "salem-nj": { id: 20, name: "Salem County, NJ" },
  // Nearby PA / DE
  "philadelphia-pa": { id: 60, name: "Philadelphia County, PA" },
  "montgomery-pa": { id: 23, name: "Montgomery County, PA" },
  "lehigh-pa": { id: 51, name: "Lehigh County, PA" },
  "newcastle-de": { id: 24, name: "New Castle County, DE" },
  "kent-de": { id: 4, name: "Kent County, DE" }
};
const SOUTH_JERSEY = ["cumberland-nj", "atlantic-nj", "gloucester-nj", "salem-nj", "camden-nj", "capemay-nj", "burlington-nj"];

const TAX_RX = /\bCUST(ODIAN)?\b|\bTAX\b|\bLIEN\b|\bTOWNSHIP\b|CITY OF|BOROUGH|TOWN OF|\bTWP\b|MUNICIPAL|SCHOOL DISTRICT|\bAUTHORITY\b|TREASURER|^(THE )?[A-Z .]+ COUNTY$|PRO CAPITAL|TOWER DB|\bMTAG\b|\bFIG\b|US BANK CUST|TAX EASE|BALANCE FUND|PHOENIX FUNDING|CRESTAR CAPITAL|ACTLIEN|FNA JERSEY|RAINIER|LIEN SOLUTIONS|ELEVATION FUND|BRIGHTWOOD|TLOA|LIENCO|STONEFIELD|EBURY FUND/i;
const HOA_RX = /CONDOMINIUM|CONDO\b|HOMEOWNERS|\bHOA\b|ASSOCIATION|ASSN\b|COMMUNITY ASS/i;
const LENDER_RX = /BANK|TRUST|MORTGAGE|LOAN|FINANCIAL|FUNDING|CAPITAL|NATIONAL ASSOCIATION|\bN\.?A\.?\b|SAVINGS|CREDIT UNION|SERVICING|LENDING/i;
const AGENCY_RX = /HOUSING AND MORTGAGE FINANCE|HUD\b|SECRETARY OF HOUSING|VETERANS AFFAIRS|FANNIE|FEDERAL NATIONAL|FREDDIE|FEDERAL HOME LOAN/i;

const decode = s => String(s || "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&colon;/g, ":")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/\s+/g, " ").trim();
const money = s => { const m = String(s || "").replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d+)?)/); return m ? Math.round(+m[1]) : 0; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, cookie) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html", ...(cookie ? { Cookie: cookie } : {}) }, signal: ctl.signal, redirect: "follow" });
    const text = await r.text();
    if (!r.ok) throw new Error(`Sheriff site returned ${r.status}`);
    const sc = r.headers.get("set-cookie");
    return { text, cookie: sc ? sc.split(/,(?=[^;]+=)/).map(c => c.split(";")[0]).join("; ") : cookie };
  } finally { clearTimeout(t); }
}

function parseList(html) {
  const rows = [];
  const rx = /<tr>\s*<td class="hidden-print"><a href="\/Sales\/SaleDetails\?PropertyId=(\d+)"[^>]*>[\s\S]*?<\/td>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = rx.exec(html))) {
    const cells = [...m[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => decode(c[1]));
    if (cells.length < 5) continue;
    rows.push({ propertyId: m[1], sheriffNo: cells[0], saleDate: cells[1], plaintiff: cells[2], defendant: cells[3], address: cells[4] });
  }
  return rows;
}

function parseDetail(html) {
  const out = {};
  const rx = /<div class="sale-detail-label">([\s\S]*?)<\/div>\s*<div class="sale-detail-value">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = rx.exec(html))) out[decode(m[1]).replace(/[:*]+$/, "").trim()] = decode(m[2]);
  const status = [...html.matchAll(/<tr>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*<\/td>\s*<\/tr>/g)].map(x => ({ status: decode(x[1]), date: x[2] }));
  const desc = out["Description"] || out["Priors"] || "";
  const judgmentTxt = (html.match(/AMOUNT OF THE JUDGMENT[^$]{0,80}\$\s*([\d,]+(?:\.\d+)?)/i) || [])[1];
  const upsetTxt = (html.match(/UPSET PRICE[^$]{0,120}\$\s*([\d,]+(?:\.\d+)?)/i) || [])[1];
  return {
    plaintiffFull: out["Plaintiff"] || "",
    defendantFull: out["Defendant"] || "",
    courtCase: out["Court Case #"] || "",
    attorney: out["Attorney"] || "",
    attorneyPhone: out["Attorney Phone"] || "",
    approxJudgment: money(out["Approx. Judgment"]) || money(judgmentTxt),
    upsetAmount: money(out["Upset Amount"]) || money(upsetTxt),
    parcel: out["Parcel #"] || out["Parcel Number"] || (desc.match(/BLOCK\s+[\w.-]+,?\s+LOT\s+[\w.-]+/i) || [""])[0],
    statusHistory: status,
    currentStatus: status.length ? status[status.length - 1].status : "Scheduled",
    adjournments: status.filter(s => /adjourn/i.test(s.status)).length,
    bankruptcy: status.some(s => /bankrupt/i.test(s.status))
  };
}

function classify(plaintiff) {
  if (TAX_RX.test(plaintiff)) return "Tax lien foreclosure";
  if (HOA_RX.test(plaintiff) && !LENDER_RX.test(plaintiff)) return "HOA / condo lien";
  if (AGENCY_RX.test(plaintiff)) return "Agency mortgage";
  return "Bank foreclosure";
}

function score(l) {
  let s = 0; const why = [];
  const days = l.daysToSale;
  if (days >= 0 && days <= 14) { s += 25; why.push("sale within 2 weeks"); }
  else if (days <= 45) { s += 18; why.push("sale within 45 days"); }
  else if (days <= 90) s += 8;
  if (l.type === "Tax lien foreclosure") { s += 25; why.push("tax-lien case: debt usually far below value"); }
  if (l.type === "HOA / condo lien") { s += 20; why.push("HOA lien: small debt"); }
  const j = l.approxJudgment || l.upsetAmount;
  if (j > 0 && j < 50000) { s += 25; why.push("judgment under $50k"); }
  else if (j > 0 && j < 125000) { s += 15; why.push("judgment under $125k"); }
  else if (j > 0 && j < 200000) s += 5;
  if (l.adjournments >= 3) { s += 10; why.push(l.adjournments + " adjournments (owner fighting/stalling)"); }
  if (l.bankruptcy) { s -= 10; why.push("bankruptcy history"); }
  if (/cancel|satisf|sold|withdraw|vacat|dismiss/i.test(l.currentStatus)) { s -= 60; why.push("status: " + l.currentStatus); }
  return { score: Math.max(0, Math.min(100, s)), why };
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch { out[k] = null; } }
  }));
  return out;
}

async function scrapeCounty(key, { detailLimit = 80 } = {}) {
  const c = COUNTIES[key]; if (!c) throw new Error("Unknown county: " + key);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  const list = await get(`${BASE}/Sales/SalesSearch?countyId=${c.id}`);
  const rows = parseList(list.text);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = rows.map(r => {
    const d = new Date(r.saleDate);
    return { ...r, daysToSale: isNaN(d) ? 999 : Math.round((d - today) / 86400000) };
  }).filter(r => r.daysToSale >= 0).sort((a, b) => a.daysToSale - b.daysToSale);
  const details = await pool(upcoming.slice(0, detailLimit), 4, async r => {
    await sleep(150);
    const d = await get(`${BASE}/Sales/SaleDetails?PropertyId=${r.propertyId}`, list.cookie);
    return parseDetail(d.text);
  });
  const leads = upcoming.map((r, i) => {
    const l = { ...r, ...(details[i] || {}), county: c.name, countyKey: key, sourceUrl: `${BASE}/Sales/SaleDetails?PropertyId=${r.propertyId}` };
    if (l.plaintiffFull) l.plaintiff = l.plaintiffFull;
    if (l.defendantFull) l.defendant = l.defendantFull;
    delete l.plaintiffFull; delete l.defendantFull;
    l.type = classify(l.plaintiff);
    const sc = score(l);
    l.score = sc.score; l.why = sc.why;
    l.zillowUrl = "https://www.zillow.com/homes/" + encodeURIComponent(l.address) + "_rb/";
    return l;
  });
  const data = { county: c.name, key, fetchedAt: new Date().toISOString(), total: rows.length, upcoming: leads.length, leads };
  cache.set(key, { at: Date.now(), data });
  return data;
}

async function hunt({ counties = SOUTH_JERSEY, type = "Tax lien foreclosure", minScore = 0, maxJudgment = 0, withinDays = 120, limit = 300 } = {}) {
  const keys = (Array.isArray(counties) ? counties : String(counties).split(",")).map(s => s.trim()).filter(k => COUNTIES[k]);
  const results = await pool(keys, 3, k => scrapeCounty(k));
  const errors = keys.filter((k, i) => !results[i]).map(k => COUNTIES[k].name);
  let leads = results.filter(Boolean).flatMap(r => r.leads);
  leads = leads.filter(l => l.daysToSale <= withinDays && l.score >= minScore && (type === "Any" || l.type === type)
    && (!maxJudgment || !(l.approxJudgment || l.upsetAmount) || (l.approxJudgment || l.upsetAmount) <= maxJudgment));
  leads.sort((a, b) => b.score - a.score || a.daysToSale - b.daysToSale);
  return { ok: true, source: "County Sheriff sale listings (salesweb.civilview.com)", counties: keys.map(k => COUNTIES[k].name), errors, count: leads.length, leads: leads.slice(0, limit) };
}

module.exports = { COUNTIES, SOUTH_JERSEY, hunt, scrapeCounty, parseList, parseDetail, classify };
