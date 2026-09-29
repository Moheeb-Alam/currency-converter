// Express server: serves the frontend and proxies the Frankfurter API (v2).
// Proxying lets us cache responses and keeps the browser code simple.
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API = "https://api.frankfurter.dev/v2";
const TTL = 10 * 60 * 1000; // cache for 10 minutes

const cache = new Map();

async function cachedFetch(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.time < TTL) return hit.data;

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Frankfurter API error");
    err.status = res.status;
    throw err;
  }
  cache.set(url, { data, time: Date.now() });
  return data;
}

const isCode = (v) => typeof v === "string" && /^[A-Za-z]{3}$/.test(v);

// GET /api/currencies -> [{ code, name }]
app.get("/api/currencies", async (req, res) => {
  try {
    const raw = await cachedFetch(`${API}/currencies`);
    let list = [];
    if (Array.isArray(raw)) {
      list = raw.map((c) => ({ code: c.iso_code || c.code, name: c.name || "" }));
    } else {
      list = Object.entries(raw).map(([code, name]) => ({ code, name: String(name) }));
    }
    list = list.filter((c) => isCode(c.code)).sort((a, b) => a.code.localeCompare(b.code));
    res.json(list);
  } catch (e) {
    res.status(e.status || 502).json({ message: e.message });
  }
});

// GET /api/rate?from=USD&to=PKR -> { from, to, rate, date }
app.get("/api/rate", async (req, res) => {
  const { from, to } = req.query;
  if (!isCode(from) || !isCode(to)) {
    return res.status(400).json({ message: "Use 3-letter currency codes." });
  }
  if (from.toUpperCase() === to.toUpperCase()) {
    return res.json({ from: from.toUpperCase(), to: to.toUpperCase(), rate: 1, date: null });
  }
  try {
    const d = await cachedFetch(`${API}/rate/${from}/${to}`);
    res.json({ from: from.toUpperCase(), to: to.toUpperCase(), rate: d.rate, date: d.date || null });
  } catch (e) {
    res.status(e.status || 502).json({ message: e.message });
  }
});

app.use(express.static(path.join(__dirname, "public")));

// Local run: node server.js. On Vercel the app is exported instead of listening.
if (require.main === module) {
  app.listen(PORT, () => console.log(`Currency converter running at http://localhost:${PORT}`));
}

module.exports = app;
