// src/pages/Confirm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../App.css";
import "../styles/home.css";
import "../styles/checkout.css"; // reuse panel / list styles

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "";
const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";

export default function Confirm() {
  const [params] = useSearchParams();
  // accept ?pi=, ?order=, or ?payment_intent= just in case
  const pi =
    params.get("pi") ||
    params.get("order") ||
    params.get("payment_intent");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // { order, items }

  useEffect(() => {
    if (!pi) {
      setError("Missing payment reference.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();
    const MAX_ATTEMPTS = 12; // ~ up to ~7–8s total with the backoff below

    const poll = async (attempt = 0) => {
      if (cancelled) return;

      try {
        const r = await fetch(`/api/orders/by-intent/${encodeURIComponent(pi)}?t=${Date.now()}`, {
          method: "GET",
          headers: { Accept: "application/json", "Cache-Control": "no-cache" },
          cache: "no-store",
          signal: ctrl.signal,
        });

        if (r.status === 200) {
          const json = await r.json();
          if (!cancelled) {
            setData(json);
            setLoading(false);
          }
          return;
        }

        if (r.status === 404 || r.status === 304) {
          // Not in DB yet; keep polling with exponential backoff
          if (attempt >= MAX_ATTEMPTS) {
            if (!cancelled) {
              setLoading(false);
              setError("We’re finalizing your order. Please refresh in a few seconds.");
            }
            return;
          }
          const delay = Math.min(4000, 500 * 2 ** attempt); // 0.5s → 1s → 2s → 4s (cap)
          setTimeout(() => poll(attempt + 1), delay);
          return;
        }

        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      } catch (e) {
        if (cancelled) return;
        // transient error; retry with a gentler backoff
        if (attempt >= MAX_ATTEMPTS) {
          setLoading(false);
          setError("We’re finalizing your order. Please refresh in a few seconds.");
          return;
        }
        const delay = Math.min(4000, 1000 * (attempt + 1)); // 1s, 2s, 3s… (cap 4s)
        setTimeout(() => poll(attempt + 1), delay);
      }
    };

    poll();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [pi]);

  const order = data?.order;
  const items = data?.items || [];

  const pickupDate = useMemo(() => fmtDate(order?.market_date), [order]);
  const pickupStart = useMemo(() => fmtTime(order?.pickup_slot), [order]);

  return (
    <main className="checkout">
      <section className="order-hero">
        <div className="container center">
          <h1 className="order-hero-title">
            {order ? "Order Confirmed" : "Finalizing Order…"}
          </h1>
          {order ? (
            <p className="order-hero-subtitle">
              #{order.id.slice(0, 8)} • {pickupDate} • Pickup at <strong>{order.market_name || order.market_id}</strong>
            </p>
          ) : (
            <p className="order-hero-subtitle">Hang tight, we’re syncing your order details.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container checkout-grid">
          {/* LEFT: confirmation details */}
          <div className="panel">
            <h3>Pickup details</h3>
            {loading ? (
              <div className="muted">Checking payment with our server…</div>
            ) : error ? (
              <div className="err">{error}</div>
            ) : (
              <>
                <div className="form-row">
                  <label>Name</label>
                  <div>{order?.customer_name || "—"}</div>
                </div>
                <div className="form-row two">
                  <div>
                    <label>Phone</label>
                    <div>{order?.customer_phone || "—"}</div>
                  </div>
                  <div>
                    <label>Email</label>
                    <div>{order?.customer_email || "—"}</div>
                  </div>
                </div>

                <h3 style={{ marginTop: 18 }}>Location & time</h3>
                <div className="pickup-box">
                  <div><strong>{order?.market_name || order?.market_id}</strong></div>
                  <div>{pickupDate} • {pickupStart}</div>
                </div>

                <div className="tiny muted" style={{ marginTop: 10 }}>
                  A receipt was emailed to {order?.customer_email || "your inbox"}.
                </div>
              </>
            )}
          </div>

          {/* RIGHT: summary of items */}
          <div className="panel">
            <h3>Your items</h3>

            {loading ? (
              <div className="muted">Loading items…</div>
            ) : items.length === 0 ? (
              <div className="muted">No items found.</div>
            ) : (
              <div className="summary-list">
                {items.map((it) => (
                  <div key={it.id} className="summary-item">
                    <div className="desc">
                      <div className="title">
                        {it.title} <span className="muted">× {it.quantity}</span>
                      </div>
                      {it.notes && (
                        <div className="meta">
                          Notes: “{it.notes}”
                        </div>
                      )}
                      {Array.isArray(it.sides) && it.sides.length > 0 && (
                        <div className="meta">
                          Sides: {it.sides.map((s) => s.title || s.side_id).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && order && (
              <div className="totals">
                <div className="row"><span>Subtotal</span><span>${(order.subtotal_cents / 100).toFixed(2)}</span></div>
                <div className="row"><span>Tip</span><span>${(order.tip_cents / 100).toFixed(2)}</span></div>
                <div className="row grand"><span>Total</span><span>${(order.total_cents / 100).toFixed(2)}</span></div>
              </div>
            )}

            <div className="checkout-actions">
              <Link className="btn btn-secondary" to="/order">Place another order</Link>
              <div className="spacer" />
              <Link className="btn btn-primary" to="/">Back to home</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
