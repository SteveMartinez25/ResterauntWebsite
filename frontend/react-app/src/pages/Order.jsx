import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import "../styles/home.css";
import "../styles/order.css";
import { useCart } from "./CartContext.jsx";
import { useNavigate } from "react-router-dom";

/* ---------- tiny fallback schedule (used only if /api/markets/next returns 404) ---------- */
const FALLBACK_MARKETS = [
  { id: "westchester", name: "Westchester Farmer's Market", day: 0, start: "09:00", end: "13:30" }, // Sun
  { id: "manhattan",   name: "Manhattan Beach Farmer's Market", day: 2, start: "11:00", end: "15:00" }, // Tue
  { id: "southpas",    name: "South Pasadena Farmer's Market",  day: 4, start: "15:00", end: "19:00" }, // Thu
  { id: "torrance",    name: "Torrance Certified Farmer's Market", day: 6, start: "08:00", end: "13:00" }, // Sat
];
function setTime(date, hhmm){ const [h,m]=hhmm.split(":").map(Number); const d=new Date(date); d.setHours(h,m,0,0); return d; }
function nextMarketFallback(now=new Date()){
  const c = FALLBACK_MARKETS.map(m=>{
    const d = new Date(now);
    const delta = (m.day - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + delta);
    let start = setTime(d, m.start);
    let end   = setTime(d, m.end);
    if (delta===0 && end <= now){ d.setDate(d.getDate()+7); start=setTime(d,m.start); end=setTime(d,m.end); }
    return { ...m, date: d, start, end };
  }).filter(x=>x.end>now).sort((a,b)=>a.start-b.start)[0];
  return c ? { id:c.id, name:c.name, date:c.date, start:c.start, end:c.end } : null;
}
const fmtDate = d => d?.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" }) || "";
const fmtTime = val => {
  const d = (val instanceof Date) ? val : new Date(val);
  return d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
};

/* ---------------------- Cart summary (uses live sides for names) ---------------------- */
function CartSummary({ sides }) {
  const navigate = useNavigate();
  const { items, setQty, removeItem, subtotal, clear } = useCart();

  const sideNames = (ids=[]) =>
    ids.map(id => sides.find(s => s.id === id)?.title || id).join(", ");

  return (
    <div className="cart-card">
      <div className="cart-head">
        <h3>Your Cart</h3>
        <div className="muted small">Subtotal: <strong>${subtotal.toFixed(2)}</strong></div>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">Your cart is empty — add items below.</div>
      ) : (
        <>
          <div className="cart-list">
            {items.map(it => (
              <div key={it.id} className="cart-item">
                <img src={it.img} alt="" />
                <div className="cart-desc">
                  <div className="title">{it.title}</div>
                  {it.meta?.kind === "pupusa" && (
                    <div className="meta">
                      {it.meta.sides?.length ? `Sides: ${sideNames(it.meta.sides)}` : "No sides"}
                      {it.meta?.notes ? ` • “${it.meta.notes}”` : ""}
                    </div>
                  )}
                </div>

                <div className="cart-qty">
                  <button onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}>−</button>
                  <input
                    type="number"
                    min="1"
                    value={it.qty}
                    onChange={(e)=> setQty(it.id, Math.max(1, parseInt(e.target.value||1,10)))}
                  />
                  <button onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                </div>

                <div className="cart-right">
                  <div className="line">${(it.price * it.qty).toFixed(2)}</div>
                  <button className="link danger" onClick={() => removeItem(it.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-foot">
            <button className="btn btn-secondary" onClick={clear}>Clear cart</button>
            <div className="spacer" />
            <div className="muted">Subtotal</div>
            <div className="sum">${subtotal.toFixed(2)}</div>
            <button className="btn btn-primary" onClick={() => navigate("/checkout")}>Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------- Pupusa card (unchanged UI) ---------------------- */
function PupusaCard({ item, market, onAdd, sides }) {
  const [selectedSides, setSelectedSides] = React.useState([]);
  const [qty, setQty] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  function toggleSide(id) {
    setSelectedSides(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : (prev.length < 2 ? [...prev, id] : prev)
    );
  }

  return (
    <article className="card">
      <div className="card-media media-16x11">
        <img src={item.img} alt={item.title} />
        {item.badge ? <span className="tag">{item.badge}</span> : null}
      </div>
      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        <p className="muted text-normal">{item.desc}</p>

        <div className="builder-group">
          <div className="builder-label">
            Choose up to 2 sides <span className="muted">({selectedSides.length}/2)</span>
          </div>
          <div className="side-options">
            {sides.map(s => (
              <label key={s.id} className={`side-option ${selectedSides.includes(s.id) ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={selectedSides.includes(s.id)}
                  onChange={() => toggleSide(s.id)}
                />
                {s.img ? <img src={s.img} alt={s.title} /> : <div className="side-thumb-fallback" />}
                <span>{s.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="builder-group">
          <label className="builder-label" htmlFor={`notes-${item.id}`}>Special requests (optional)</label>
          <textarea
            id={`notes-${item.id}`} className="textarea" rows={2}
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="No onions, extra crispy, etc."
          />
        </div>

        <div className="card-row">
          <span className="price">${item.price.toFixed(2)}</span>
          <div className="qty">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
            <input type="number" min="1" value={qty} onChange={(e)=>setQty(Math.max(1, parseInt(e.target.value||1,10)))} />
            <button onClick={() => setQty(qty + 1)} aria-label="Increase">+</button>
          </div>
          <button className="btn btn-primary" onClick={() => onAdd(item, qty, selectedSides, notes)}>
            Add to Cart • ${(item.price * qty).toFixed(2)}
          </button>
        </div>

        <div className="muted small" style={{marginTop:8}}>
          Pickup at {market.name} • {fmtDate(market.date)}
        </div>
      </div>
    </article>
  );
}

/* ----------------------------------- Page ----------------------------------- */
export default function Order() {
  const { addItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const [market, setMarket] = useState(null);       // { id, name, date, start, end }
  const [pupusas, setPupusas] = useState([]);       // mapped from /api/menu
  const [drinks, setDrinks]   = useState([]);
  const [sides, setSides]     = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);

        // load menu (items + sides)
        const menuRes = await fetch("/api/menu");
        const menu = await menuRes.json();

        const mapItem = (i) => ({
          id: i.id,
          title: i.title,
          img: i.imageUrl || "",           // backend field is imageUrl
          price: (i.priceCents ?? 0) / 100,
          desc: i.desc || "",
        });

        const pup = (menu.items || []).filter(i => i.type === "PUPUSA").map(mapItem);
        const drk = (menu.items || []).filter(i => i.type === "DRINK").map(mapItem);
        const sds = (menu.sides || []).map(s => ({ id: s.id, title: s.title, img: s.imageUrl || "" }));

        // load next market (API). If 404, fallback to weekly schedule
        const mRes = await fetch("/api/markets/next-open");

        let mkt = null;
        if (mRes.ok) {
          const m = await mRes.json();
          mkt = {
            id: m.marketId || m.id,
            name: m.name,
            date: new Date(m.dateISO || m.startISO),
            start: new Date(m.startISO),
            end: new Date(m.endISO),
          };
        } else if (mRes.status === 404) {
          mkt = nextMarketFallback(new Date());
        }

        if (mounted) {
          setPupusas(pup);
          setDrinks(drk);
          setSides(sds);
          setMarket(mkt);
          setError(null);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError("Could not load menu/market");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function addPupusa(item, qty, selectedSides, notes) {
    if (!market) return;
    const variantKey = selectedSides.slice().sort().join("+") + "|" + (notes.trim() ? "notes" : "");
    const cartId = `${item.id}::${variantKey || "plain"}`;

    addItem(
      {
        id: cartId,
        title: item.title,
        img: item.img,
        price: item.price,
        meta: {
          kind: "pupusa",
          baseId: item.id,
          sides: selectedSides,
          notes: notes.trim(),
          marketId: market.id,
          marketName: market.name,
          marketDateISO: market.date.toISOString(),
        },
      },
      qty
    );
    alert(`Added ${qty} × ${item.title} for ${market.name}.`);
  }

  function addDrink(drink) {
    if (!market) return;
    addItem({
      id: drink.id,
      title: drink.title,
      img: drink.img,
      price: drink.price,
      meta: { kind: "drink", marketId: market.id, marketName: market.name, marketDateISO: market.date.toISOString() }
    }, 1);
  }

  if (loading) {
    return (
      <main className="order-next">
        <section className="order-hero">
          <div className="container center">
            <h1 className="order-hero-title">Order</h1>
            <p className="order-hero-subtitle">Loading menu…</p>
          </div>
        </section>
      </main>
    );
  }

  if (!market) {
    return (
      <main className="order-next">
        <section className="order-hero">
          <div className="container center">
            <h1 className="order-hero-title">Order</h1>
            <p className="order-hero-subtitle">
              Online ordering is currently closed. Please try again later. See <a href="/locations">Locations</a>.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="order-next">
      {/* HERO */}
      <section className="order-hero">
        <div className="container center">
          <span className="pill">Pickup at next market</span>
          <h1 className="order-hero-title">Order</h1>
          <p className="order-hero-subtitle">
            Ordering for: <strong>{market.name}</strong> • {fmtDate(market.date)} • {fmtTime(market.start)}–{fmtTime(market.end)}
          </p>
        </div>
      </section>

      {/* CART (top) */}
      <section className="section">
        <div className="container">
          <CartSummary sides={sides} />
        </div>
      </section>

      {/* PUPUSAS */}
      <section className="section">
        <div className="container">
          <div className="row between align-center section-head">
            <h2 className="heading">Pupusas</h2>
            <div className="muted">Pick a pupusa and choose up to two sides.</div>
          </div>
          <div className="grid grid-cards">
            {pupusas.map((item) => (
              <PupusaCard
                key={item.id}
                item={item}
                market={market}
                sides={sides}
                onAdd={addPupusa}
              />
            ))}
          </div>
        </div>
      </section>

      {/* LEMONADES */}
      <section className="section">
        <div className="container">
          <div className="row between align-center section-head">
            <h2 className="heading">Lemonades</h2>
            <div className="muted">Fresh-squeezed, made daily.</div>
          </div>

          <div className="grid grid-cards">
            {drinks.map(drink => (
              <article key={drink.id} className="card">
                <div className="card-media media-16x11">
                  <img src={drink.img} alt={drink.title} />
                  {drink.badge ? <span className="tag">{drink.badge}</span> : null}
                </div>
                <div className="card-body">
                  <h3 className="card-title">{drink.title}</h3>
                  <p className="muted text-normal">{drink.desc}</p>
                  <div className="card-row">
                    <span className="price">${drink.price.toFixed(2)}</span>
                    <button className="btn btn-secondary" onClick={() => addDrink(drink)}>Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
