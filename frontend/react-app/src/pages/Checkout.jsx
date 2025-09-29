import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "../App.css";
import "../styles/home.css";
import "../styles/checkout.css";
import { useCart } from "./CartContext.jsx";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK);

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
  for (let t = new Date(start); t < end; t = new Date(t.getTime() + everyMin * 60000)) out.push(new Date(t));
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

/* ── Stripe sub-component (hooks live inside <Elements>) ───────────────────── */
function StripePaymentBox({ orderId, total, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // stays on page unless 3DS needed
      confirmParams: { return_url: window.location.origin + `/confirm?order=${orderId}` },
    });

    if (error) {
      setError(error.message || "Payment failed");
      setSubmitting(false);
    } else {
      onPaid?.(orderId);
    }
  }

  return (
    <form onSubmit={handlePay} className="payment-box">
      <PaymentElement />
      {error && <div className="err" style={{ marginTop: 8 }}>{error}</div>}
      <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={!stripe || submitting}>
        {submitting ? "Processing…" : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  );
}

/* ── Left panel: contact + pickup + tip + embedded payment ─────────────────── */
function PaymentPanel({
  market, items, subtotal,
  contact, setContact,
  slots, slotISO, setSlotISO,
  tipChoice, setTipChoice, tipCustomDollar, setTipCustomDollar,
  total,
  onPaid
}) {
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [intentBusy, setIntentBusy] = useState(false);
  const [intentErr, setIntentErr] = useState("");

  const orderingClosed = (() => {
    if (!market) return true;
    const now = new Date();
    return now > market.end;
  })();
  const canInit = items.length > 0 && market && !orderingClosed &&
                  contact.name.trim().length >= 2 && phoneOk(contact.phone) &&
                  emailOk(contact.email) && !!slotISO;

  // Avoid spamming the server with identical payloads
  const signature = JSON.stringify({
    items: items.map(it => ({ id: it.id, qty: it.qty, meta: it.meta })),
    tipChoice, tipCustomDollar,
    slotISO,
    contact,
  });
  const lastSigRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    async function initIntent() {
      if (!canInit) { setClientSecret(null); setOrderId(null); return; }
      if (signature === lastSigRef.current) return;
      lastSigRef.current = signature;

      setIntentBusy(true); setIntentErr("");

      const startISO = slotISO;
      const endISO = new Date(new Date(slotISO).getTime() + 15 * 60 * 1000).toISOString();

      const payload = {
        contact,
        pickup: { startISO, endISO },
        tip: tipChoice === "custom"
          ? { type: "custom", value: Number(tipCustomDollar || 0) }
          : tipChoice === "none"
            ? { type: "none", value: 0 }
            : { type: "percent", value: Number(tipChoice) }, // 10/15/20
        cart: items.map(it => ({ id: it.id, qty: it.qty, meta: it.meta })),
      };

      try {
        const res = await fetch("/api/payments/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initialize payment");

        if (!cancelled) {
          setClientSecret(data.clientSecret);
          setOrderId(data.orderId);
        }
      } catch (e) {
        if (!cancelled) {
          setIntentErr(e.message);
          setClientSecret(null);
          setOrderId(null);
        }
      } finally {
        if (!cancelled) setIntentBusy(false);
      }
    }
    initIntent();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canInit, signature]);

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#f0ae1c",
      colorText: "#1f1f1f",
      colorBackground: "#ffffff",
      colorDanger: "#b00020",
      borderRadius: "12px",
    },
    rules: { ".Input": { padding: "12px 14px" }, ".Tab, .Block": { borderRadius: "12px" } },
  };

  return (
    <div className="panel">
      <h3>Contact info</h3>
      <div className="form-row">
        <label>Full name</label>
        <input value={contact.name} onChange={(e) => setContact(v=>({ ...v, name:e.target.value }))} placeholder="Jane Doe" />
      </div>
      <div className="form-row two">
        <div>
          <label>Phone</label>
          <input value={contact.phone} onChange={(e) => setContact(v=>({ ...v, phone:e.target.value }))} placeholder="(555) 555-5555" />
          {!phoneOk(contact.phone) && contact.phone && <div className="err">Enter a valid phone.</div>}
        </div>
        <div>
          <label>Email</label>
          <input value={contact.email} onChange={(e) => setContact(v=>({ ...v, email:e.target.value }))} placeholder="you@email.com" />
          {!emailOk(contact.email) && contact.email && <div className="err">Enter a valid email.</div>}
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
        {!slotISO && <div className="err">Please choose a pickup time.</div>}
        {orderingClosed && (
          <div className="err" style={{ marginTop: 6 }}>
            Ordering is closed for this market. Return to <a href="/order">Order</a>.
          </div>
        )}
      </div>

      <h3 style={{ marginTop: 18 }}>Payment</h3>
      <div className="tips" style={{ marginBottom: 8 }}>
        {[
          { key: "none",   label: "Tip: None" },
          { key: "10",     label: "Tip: 10%" },
          { key: "15",     label: "Tip: 15%" },
          { key: "20",     label: "Tip: 20%" },
          { key: "custom", label: "Tip: Custom $" },
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

      {intentErr && <div className="err" style={{ marginBottom: 8 }}>{intentErr}</div>}
      {intentBusy && <div className="muted tiny" style={{ marginBottom: 8 }}>Preparing secure payment…</div>}

      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <StripePaymentBox orderId={orderId} total={total} onPaid={onPaid} />
        </Elements>
      ) : (
        <div className="card" style={{ padding: 12, opacity: 0.7 }}>
          <div className="muted">Payment will appear here once the form is complete.</div>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function Checkout() {
  const navigate = useNavigate();
  const { items, setQty, removeItem, subtotal, clear } = useCart();

  const market = useCartMarket(items);

  // Left-side state
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const slots = useMemo(() => {
    if (!market) return [];
    return makeSlots(market.date, byId[market.id].start, byId[market.id].end, 15);
  }, [market]);
  const [slotISO, setSlotISO] = useState("");

  const [tipChoice, setTipChoice] = useState("15");
  const [tipCustomDollar, setTipCustomDollar] = useState("");

  // Preview totals (UI only — server re-prices)
  const tipAmount = useMemo(() => {
    if (tipChoice === "none") return 0;
    if (tipChoice === "custom") return Math.max(0, Number(tipCustomDollar || 0));
    const pct = Number(tipChoice || 0);
    return Math.round(subtotal * (pct / 100) * 100) / 100;
  }, [tipChoice, tipCustomDollar, subtotal]);
  const total = Math.round((subtotal + tipAmount) * 100) / 100;

  // Sides titles for summary (UI only)
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
          {/* LEFT: contact + pickup + tip + embedded payment */}
          <PaymentPanel
            market={market}
            items={items}
            subtotal={subtotal}
            contact={contact}
            setContact={setContact}
            slots={slots}
            slotISO={slotISO}
            setSlotISO={setSlotISO}
            tipChoice={tipChoice}
            setTipChoice={setTipChoice}
            tipCustomDollar={tipCustomDollar}
            setTipCustomDollar={setTipCustomDollar}
            total={total}
            onPaid={(orderId) => { clear(); window.location.href = `/confirm?order=${orderId}`; }}
          />

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
            </div>

            <div className="tiny muted" style={{ marginTop: 6 }}>
              Payments are processed securely by Stripe. You’ll remain on this page; some cards may show a quick bank verification.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
