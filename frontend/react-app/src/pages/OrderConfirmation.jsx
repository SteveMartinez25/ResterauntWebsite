import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../App.css";
import "../styles/home.css";
import "../styles/order-confirmation.css";
import { useCart } from "./CartContext.jsx";

/** If you want a Maps link, add addresses here (ids should match your checkout metadata.market_id). */
const MARKET_ADDRESSES = {
  westchester: "6200 W 87th St, Los Angeles, CA 90045",
  manhattan: "Civic Center Upper Lot, 320 15th St, Manhattan Beach, CA 90266",
  southpas: "920 Meridian Ave, South Pasadena, CA 91030",
  torrance: "2200 Crenshaw Blvd, Torrance, CA 90501",
};

const fmtMoney = (n) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;
const fmtDate = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const { clear } = useCart();
  const clearedOnce = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setErr("Missing session_id in the URL.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        // Clear cart exactly once after we have a paid session
        if (!clearedOnce.current && json?.payment_status === "paid") {
          clear();
          clearedOnce.current = true;
        }
      } catch (e) {
        console.error(e);
        setErr("We couldn’t verify your payment right now. If you saw a receipt from Stripe, your order is confirmed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, clear]);

  const marketName = data?.metadata?.market_name;
  const marketId   = data?.metadata?.market_id;
  const marketDate = data?.metadata?.market_dateISO ? new Date(data.metadata.market_dateISO) : null;
  const pickupISO  = data?.metadata?.pickup_slotISO || null;

  // Extract items & tip
  const items = data?.line_items || [];
  const [tipAmount, itemsTotal] = useMemo(() => {
    let tip = 0, sub = 0;
    for (const li of items) {
      // Stripe returns amounts in cents
      const liTotal = (li.amount_total ?? li.amount_subtotal ?? 0) / 100;
      const name = (li.description || li?.price?.product?.name || "").toLowerCase();
      if (name === "tip") tip += liTotal;
      else sub += liTotal;
    }
    return [tip, sub];
  }, [items]);

  const grandTotal = (data?.amount_total ?? 0) / 100 || (itemsTotal + tipAmount);

  const mapsHref = marketId && MARKET_ADDRESSES[marketId]
    ? `https://www.google.com/maps?q=${encodeURIComponent(MARKET_ADDRESSES[marketId])}`
    : null;

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Order Confirmed",
          text: `Pickup at ${marketName} ${marketDate ? fmtDate(marketDate) : ""}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      }
    } catch {
      /* no-op */
    }
  }

  function downloadICS() {
    // Create a simple calendar event for the pickup time
    const start = pickupISO ? new Date(pickupISO) : (marketDate || new Date());
    const end   = new Date(start.getTime() + 15 * 60000); // 15-minute window
    const dt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const title = `Order pickup — Deisy’s Tasty Food @ ${marketName || "Market"}`;
    const loc = MARKET_ADDRESSES[marketId] || marketName || "Pickup location";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Deisy's Tasty Food//Order//EN",
      "BEGIN:VEVENT",
      `UID:${(data?.id || "order")}@deisy`,
      `DTSTAMP:${dt(new Date())}`,
      `DTSTART:${dt(start)}`,
      `DTEND:${dt(end)}`,
      `SUMMARY:${title}`,
      `LOCATION:${loc.replace(/,/g, "\\,")}`,
      `DESCRIPTION:Order ${data?.id || ""} — bring your email receipt.`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pickup-${data?.id || "order"}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="confirm">
      <section className="order-hero">
        <div className="container center">
          <h1 className="order-hero-title">{err ? "We’re checking your order…" : "Order Confirmed"}</h1>
          {loading && <p className="order-hero-subtitle">Loading your receipt…</p>}
          {!loading && err && <p className="order-hero-subtitle">{err}</p>}
          {!loading && !err && (
            <p className="order-hero-subtitle">
              Order <strong>{data?.id}</strong> • {data?.payment_status === "paid" ? "Paid" : data?.payment_status}
            </p>
          )}
        </div>
      </section>

      {!loading && !err && (
        <section className="section">
          <div className="container receipt-grid">
            {/* Left: details */}
            <div className="panel">
              <h3>Pickup details</h3>
              <div className="receipt-box">
                <div className="row">
                  <span>Market</span>
                  <strong>{marketName || "—"}</strong>
                </div>
                <div className="row">
                  <span>Date</span>
                  <strong>{marketDate ? fmtDate(marketDate) : "—"}</strong>
                </div>
                <div className="row">
                  <span>Pickup time</span>
                  <strong>{pickupISO ? fmtTime(pickupISO) : "—"}</strong>
                </div>
                {mapsHref && (
                  <div className="row">
                    <span>Address</span>
                    <a href={mapsHref} target="_blank" rel="noreferrer">{MARKET_ADDRESSES[marketId]}</a>
                  </div>
                )}
              </div>

              <h3 style={{ marginTop: 18 }}>Customer</h3>
              <div className="receipt-box">
                <div className="row">
                  <span>Name</span>
                  <strong>{data?.customer_details?.name || "—"}</strong>
                </div>
                <div className="row">
                  <span>Email</span>
                  <strong>{data?.customer_details?.email || "—"}</strong>
                </div>
                <div className="row">
                  <span>Phone</span>
                  <strong>{data?.customer_details?.phone || "—"}</strong>
                </div>
              </div>

              <div className="actions">
                {mapsHref && <button className="btn btn-secondary" onClick={() => window.open(mapsHref, "_blank")}>Open in Maps</button>}
                <button className="btn btn-secondary" onClick={downloadICS}>Add to Calendar</button>
                <button className="btn btn-secondary" onClick={handlePrint}>Print</button>
                <button className="btn btn-secondary" onClick={handleShare}>Share</button>
              </div>
            </div>

            {/* Right: items & totals */}
            <div className="panel">
              <h3>Receipt</h3>
              <div className="receipt-items">
                {items.map((li) => (
                  <div key={li.id || li.description} className="item">
                    <div className="desc">
                      <div className="title">{li.description || li?.price?.product?.name || "Item"}</div>
                      {li?.metadata?.notes ? <div className="muted small">“{li.metadata.notes}”</div> : null}
                    </div>
                    <div className="qty">×{li.quantity}</div>
                    <div className="amt">{fmtMoney((li.amount_total ?? li.amount_subtotal ?? 0) / 100)}</div>
                  </div>
                ))}
              </div>

              <div className="totals">
                <div className="row">
                  <span>Items</span>
                  <span>{fmtMoney(itemsTotal)}</span>
                </div>
                <div className="row">
                  <span>Tip</span>
                  <span>{fmtMoney(tipAmount)}</span>
                </div>
                <div className="row grand">
                  <span>Total paid</span>
                  <span>{fmtMoney(grandTotal)}</span>
                </div>
              </div>

              <div className="actions">
                <Link to="/order" className="btn btn-primary">Start a new order</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
