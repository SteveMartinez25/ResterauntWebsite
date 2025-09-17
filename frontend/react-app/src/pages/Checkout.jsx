import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "../styles/home.css";
import "../styles/checkout.css";
import { useCart } from "./CartContext.jsx";

/* ── Market schedule (0=Sun…6=Sat) ─────────────────────────────────────────── */
const MARKETS = [
  { id: "westchester", name: "Westchester Farmer's Market", day: 0, start: "09:00", end: "13:30" },
  { id: "manhattan",   name: "Manhattan Beach Farmer's Market", day: 2, start: "11:00", end: "15:00" },
  { id: "southpas",    name: "South Pasadena Farmer's Market",  day: 4, start: "15:00", end: "19:00" },
  { id: "torrance",    name: "Torrance Certified Farmer's Market", day: 6, start: "08:00", end: "13:00" },
];

const byId = Object.fromEntries(MARKETS.map(m => [m.id, m]));
const fmtDate = d => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
function setTime(date, hhmm) { const [h,m]=hhmm.split(":").map(Number); const d=new Date(date); d.setHours(h,m,0,0); return d; }
function fmtTime(val) { const d = val instanceof Date ? val : setTime(new Date(), val); return d.toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" }); }
function makeSlots(dayDate, startHHMM, endHHMM, everyMin = 15) {
  const start = setTime(dayDate, startHHMM);
  const end   = setTime(dayDate, endHHMM);
  const out = [];
  for (let t = new Date(start); t <= end; t = new Date(t.getTime() + everyMin * 60000)) out.push(new Date(t));
  return out;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const emailOk = (s) => /\S+@\S+\.\S+/.test(String(s).trim());
const phoneOk = (s) => /^[0-9\s\-+()]{7,}$/.test(String(s).trim());

function useCartMarket(items) {
  if (!items.length) return null;
  const m0 = items[0]?.meta;
  if (!m0?.marketId || !m0?.marketDateISO) return null;
  const allSame = items.every(it => it.meta?.marketId === m0.marketId && it.meta?.marketDateISO === m0.marketDateISO);
  if (!allSame) return null;
  const base = byId[m0.marketId];
  if (!base) return null;
  const date = new Date(m0.marketDateISO);
  return {
    id: m0.marketId,
    name: m0.marketName || base.name,
    date,
    start: setTime(date, base.start),
    end: setTime(date, base.end),
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, setQty, removeItem, subtotal } = useCart();

  const market = useCartMarket(items);

  // Contact form
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Pickup time (REQUIRED – no ASAP)
  const slots = useMemo(() => {
    if (!market) return [];
    return makeSlots(market.date, byId[market.id].start, byId[market.id].end, 15);
  }, [market]);
  const [slotISO, setSlotISO] = useState("");

  // Tip options: none, 10, 15, 20, custom $ (dollar amount)
  const [tipChoice, setTipChoice] = useState("15"); // "none" | "10" | "15" | "20" | "custom"
  const [tipCustomDollar, setTipCustomDollar] = useState("");
  const tipAmount = (() => {
    if (tipChoice === "none") return 0;
    if (tipChoice === "custom") return Math.max(0, Number(tipCustomDollar || 0));
    const pct = Number(tipChoice);
    return Math.round(subtotal * (pct / 100) * 100) / 100;
  })();
  const total = Math.round((subtotal + tipAmount) * 100) / 100;

  // Validation
  const orderingClosed = (() => {
    if (!market) return true;
    const now = new Date();
    return now > market.end; // after market hours
  })();
  const canSubmit =
    items.length > 0 &&
    market &&
    !orderingClosed &&
    name.trim().length >= 2 &&
    phoneOk(phone) &&
    emailOk(email) &&
    !!slotISO;  // must pick a slot

  async function placeOrder() {
    if (!canSubmit) return;

    // Build line items for Stripe (amounts in cents)
    const lineItems = items.map((it) => ({
      name: it.title,
      quantity: it.qty,
      unit_amount: Math.round(it.price * 100),
      image: it.img,
    }));

    const payload = {
      lineItems,
      tipCents: Math.round(tipAmount * 100),
      customer: { name, phone, email },
      market: {
        id: market.id,
        name: market.name,
        dateISO: market.date.toISOString(),
        startISO: market.start.toISOString(),
        endISO: market.end.toISOString(),
      },
      pickup: {
        mode: "SLOT",
        slotISO,
      },
    };

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert("Checkout endpoint returned no URL.");
    } catch (err) {
      console.error(err);
      alert("Could not start checkout. Is your /api/create-checkout-session running?");
    }
  }

  // Sides map for summary text
  const SIDES = [
    { id: "s-curtido", title: "Curtido" },
    { id: "s-salsa", title: "Salsa" },
    { id: "s-guac", title: "Creamy Guacamole" },
    { id: "s-sour", title: "Sour Cream" },
  ];
  const sideTitle = id => SIDES.find(s => s.id === id)?.title || id;

  return (
    <main className="checkout">
      <section className="order-hero">
        <div className="container center">
          <h1 className="order-hero-title">Checkout</h1>
          {market ? (
            <p className="order-hero-subtitle">
              Ordering for <strong>{market.name}</strong> • {fmtDate(market.date)} • {fmtTime(market.start)}–{fmtTime(market.end)}
            </p>
          ) : (
            <p className="order-hero-subtitle">Your cart is empty or mixed between markets.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container checkout-grid">
          {/* LEFT: form */}
          <div className="panel">
            <h3>Contact info</h3>
            <div className="form-row">
              <label>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="form-row two">
              <div>
                <label>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
                {!phoneOk(phone) && phone && <div className="err">Enter a valid phone.</div>}
              </div>
              <div>
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                {!emailOk(email) && email && <div className="err">Enter a valid email.</div>}
              </div>
            </div>

            <h3 style={{ marginTop: 18 }}>Pickup time</h3>
            <div className="pickup-box">
              <label>Select a 15-minute window</label>
              <select
                className="slot-select"
                value={slotISO}
                onChange={(e) => setSlotISO(e.target.value)}
                disabled={!market || orderingClosed}
              >
                <option value="">Choose a time…</option>
                {slots.map((s) => (
                  <option key={s.toISOString()} value={s.toISOString()}>
                    {fmtTime(s)}
                  </option>
                ))}
              </select>
              {(!slotISO) && <div className="err">Please choose a pickup time.</div>}
              {orderingClosed && (
                <div className="err" style={{ marginTop: 6 }}>
                  Ordering is closed for this market. Return to <a href="/order">Order</a>.
                </div>
              )}
            </div>

            <h3 style={{ marginTop: 18 }}>Tip</h3>
            <div className="tips">
              {[
                { key: "none", label: "None" },
                { key: "10",   label: "10%" },
                { key: "15",   label: "15%" },
                { key: "20",   label: "20%" },
                { key: "custom", label: "Custom $" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`chip ${tipChoice === key ? "active" : ""}`}
                  onClick={() => setTipChoice(key)}
                  type="button"
                >
                  {label}
                </button>
              ))}
              {tipChoice === "custom" && (
                <input
                  className="tip-input"
                  type="number"
                  min="0"
                  step="0.25"
                  placeholder="$"
                  value={tipCustomDollar}
                  onChange={(e) => setTipCustomDollar(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* RIGHT: summary */}
          <div className="panel">
            <h3>Order summary</h3>

            {items.length === 0 ? (
              <div className="muted">Your cart is empty.</div>
            ) : (
              <div className="summary-list">
                {items.map((it) => (
                  <div key={it.id} className="summary-item">
                    <img src={it.img} alt="" />
                    <div className="desc">
                      <div className="title">{it.title}</div>
                      {it.meta?.kind === "pupusa" && (
                        <div className="meta">
                          {it.meta?.sides?.length ? `Sides: ${it.meta.sides.map(sideTitle).join(", ")}` : "No sides"}
                          {it.meta?.notes ? ` • “${it.meta.notes}”` : ""}
                        </div>
                      )}
                    </div>

                    <div className="qty">
                      <button onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}>−</button>
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={(e) => setQty(it.id, Math.max(1, parseInt(e.target.value || 1, 10)))}
                      />
                      <button onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                    </div>

                    <div className="right">
                      <div className="line">${(it.price * it.qty).toFixed(2)}</div>
                      <button className="link danger" onClick={() => removeItem(it.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="totals">
              <div className="row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="row"><span>Tip</span><span>${tipAmount.toFixed(2)}</span></div>
              <div className="row grand"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>

            <div className="checkout-actions">
              <button className="btn btn-secondary" onClick={() => navigate("/order")}>Keep shopping</button>
              <div className="spacer" />
              <button
                className="btn btn-primary"
                disabled={!canSubmit}
                onClick={placeOrder}
                title={!canSubmit ? "Fill contact info and choose a pickup window" : "Continue to Stripe"}
              >
                Place Order
              </button>
            </div>

            <div className="tiny muted" style={{ marginTop: 6 }}>
              You’ll be redirected to Stripe to complete payment.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
