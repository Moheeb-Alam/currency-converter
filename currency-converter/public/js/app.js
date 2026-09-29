const $ = (id) => document.getElementById(id);
const amountEl = $("amount"), fromEl = $("from"), toEl = $("to");
const PAIRS = [["USD", "PKR"], ["EUR", "PKR"], ["GBP", "PKR"], ["USD", "EUR"], ["USD", "INR"], ["AED", "PKR"]];

let timer;

// Format a number as money; fall back to plain number if the code is unknown to Intl.
function money(value, code) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} ${code}`;
  }
}

function showError(msg) {
  const el = $("error");
  el.textContent = msg || "";
  el.classList.toggle("hidden", !msg);
}

async function getJSON(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

async function convert() {
  const amount = parseFloat(amountEl.value);
  const from = fromEl.value, to = toEl.value;
  if (!from || !to) return;
  if (!(amount >= 0)) {
    $("result-to").textContent = "Enter an amount";
    $("result-from").innerHTML = "&nbsp;";
    $("result-rate").innerHTML = "&nbsp;";
    return;
  }
  try {
    showError("");
    const { rate, date } = await getJSON(`/api/rate?from=${from}&to=${to}`);
    $("result-from").textContent = `${money(amount, from)} =`;
    $("result-to").textContent = money(amount * rate, to);
    const when = date ? ` · rates from ${date}` : "";
    $("result-rate").textContent = `1 ${from} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}${when}`;
  } catch (e) {
    showError(`Could not load the rate. ${e.message} Check your connection and try again.`);
  }
}

const debounced = () => { clearTimeout(timer); timer = setTimeout(convert, 250); };

function setPair(from, to) {
  fromEl.value = from;
  toEl.value = to;
  convert();
}

async function init() {
  try {
    const list = await getJSON("/api/currencies");
    const options = list.map((c) => `<option value="${c.code}">${c.code} — ${c.name}</option>`).join("");
    fromEl.innerHTML = toEl.innerHTML = options;
    setPair("USD", "PKR");
  } catch (e) {
    $("result-to").textContent = "Unavailable";
    showError(`Could not load currencies. ${e.message}`);
  }

  $("pairs").innerHTML = PAIRS.map(([f, t]) => `<button type="button" class="pair-chip" data-from="${f}" data-to="${t}">${f} → ${t}</button>`).join("");
}

$("pairs").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) setPair(b.dataset.from, b.dataset.to);
});

$("swap").addEventListener("click", (e) => {
  e.currentTarget.classList.toggle("spin");
  setPair(toEl.value, fromEl.value);
});

amountEl.addEventListener("input", debounced);
fromEl.addEventListener("change", convert);
toEl.addEventListener("change", convert);

init();
