import React, { useMemo } from "react";
import "../App.css";
import "../styles/home.css";
import "../styles/order.css";
import { useCart } from "./CartContext.jsx";
import { useNavigate } from "react-router-dom";

/* ---- Market schedule (0=Sun … 6=Sat) ---- */
const MARKETS = [
  { id: "westchester", name: "Westchester Farmer's Market", day: 0, start: "09:00", end: "13:30" }, // Sun
  { id: "manhattan",   name: "Manhattan Beach Farmer's Market", day: 2, start: "11:00", end: "15:00" }, // Tue
  { id: "southpas",    name: "South Pasadena Farmer's Market",  day: 4, start: "15:00", end: "19:00" }, // Thu
  { id: "torrance",    name: "Torrance Certified Farmer's Market", day: 6, start: "08:00", end: "13:00" }, // Sat
];

function setTime(date, hhmm) { const [h, m] = hhmm.split(":").map(Number); const d = new Date(date); d.setHours(h, m, 0, 0); return d; }
function nextMarketNow(now = new Date()) {
  const candidates = MARKETS.map(m => {
    const d = new Date(now);
    const delta = (m.day - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + delta);
    let start = setTime(d, m.start);
    let end   = setTime(d, m.end);
    if (delta === 0 && end <= now) { d.setDate(d.getDate() + 7); start = setTime(d, m.start); end = setTime(d, m.end); }
    return { ...m, date: d, start, end };
  }).filter(c => c.end > now);
  candidates.sort((a,b)=>a.start-b.start);
  return candidates[0] || null;
}
const fmtDate = d => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
function fmtTime(val){
  let d;
  if (val instanceof Date) d = val;
  else if (typeof val === "string") { const [hh,mm]=val.split(":").map(Number); d=new Date(); d.setHours(hh,mm,0,0); }
  else return "";
  return d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}

/* Data */
const PUPUSAS = [
  { id:"p-cheese",      title:"Cheese Pupusa",              img:"https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop", price:4.50, badge:"Bestseller", desc:"Hand-pressed masa with melty queso." },
  { id:"p-bean-cheese", title:"Bean & Cheese Pupusa",       img:"https://images.unsplash.com/photo-1606756790138-261d2b21cd1b?q=80&w=1200&auto=format&fit=crop", price:4.75, badge:"Vegetarian", desc:"Creamy refried beans & queso." },
  { id:"p-pork-bean",   title:"Pork, Bean & Cheese Pupusa", img:"https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop", price:5.25, desc:"Slow-braised pork, beans & cheese." },
  { id:"p-veg-cheese",  title:"Vegetables & Cheese Pupusa", img:"https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop", price:4.95, desc:"Seasonal veggies with queso." },
  { id:"p-loroco",      title:"Loroco & Cheese Pupusa",     img:"https://images.unsplash.com/photo-1546549039-b3429f7df3fb?q=80&w=1200&auto=format&fit=crop", price:5.25, badge:"Signature", desc:"Floral loroco buds & cheese." },
  { id:"p-pork-cheese", title:"Pork & Cheese Pupusa",       img:"https://images.unsplash.com/photo-1604908176997-43162f8d7ecd?q=80&w=1200&auto=format&fit=crop", price:5.00, desc:"Savory pork with queso." },
];

const SIDES = [
  { id:"s-curtido", title:"Curtido", img:"https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=400&auto=format&fit=crop" },
  { id:"s-salsa",   title:"Salsa", img:"https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?q=80&w=400&auto=format&fit=crop" },
  { id:"s-guac",    title:"Creamy Guacamole", img:"https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=400&auto=format&fit=crop" },
  { id:"s-sour",    title:"Sour Cream", img:"https://images.unsplash.com/photo-1604908554269-9eacb5f3d140?q=80&w=400&auto=format&fit=crop" },
];

const LEMONADES = [
  { id:"d-regular",   title:"Regular Lemonade",   img:"https://images.unsplash.com/photo-1556679343-c7306c2d037f?q=80&w=1200&auto=format&fit=crop", price:4.00, badge:"Most Loved", desc:"Fresh-squeezed classic." },
  { id:"d-strawberry",title:"Strawberry Lemonade",img:"https://images.unsplash.com/photo-1505935428862-770b6f24f629?q=80&w=1200&auto=format&fit=crop", price:4.50, desc:"Real strawberries, made daily." },
  { id:"d-mango",     title:"Mango Lemonade",     img:"https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=1200&auto=format&fit=crop", price:4.50, desc:"Sunny & tropical." },
  { id:"d-cucumber",  title:"Cucumber Lemonade",  img:"https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=1200&auto=format&fit=crop", price:4.50, desc:"Cool & refreshing." },
];

/* --- Cart summary (top of page) --- */
function CartSummary() {
  const navigate = useNavigate();
  const { items, setQty, removeItem, subtotal, clear } = useCart();

  const sideNames = (ids=[]) =>
    ids.map(id => SIDES.find(s => s.id === id)?.title || id).join(", ");

  return (
    <div className="cart-card">
      <div className="cart-head">
        <h3>Your Cart</h3>
        <div className="muted small">Subtotal: <strong>${subtotal.toFixed(2)}</strong></div>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          Your cart is empty — add items below.
        </div>
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

/* --- Pupusa card with sides inside --- */
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
                <img src={s.img} alt={s.title} />
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

        {/* footer row – now wrap-safe and clipped inside card */}
        <div className="card-row">
          <span className="price">${item.price.toFixed(2)}</span>
          <div className="qty">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
            <input type="number" min="1" value={qty} onChange={(e)=>setQty(Math.max(1, parseInt(e.target.value||1,10)))} />
            <button onClick={() => setQty(qty + 1)} aria-label="Increase">+</button>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onAdd(item, qty, selectedSides, notes)}
          >
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

export default function Order() {
  const market = useMemo(() => nextMarketNow(new Date()), []);
  const { addItem } = useCart();

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

  if (!market) {
    return (
      <main className="order-next">
        <section className="order-hero">
          <div className="container center">
            <h1 className="order-hero-title">Order</h1>
            <p className="order-hero-subtitle">Online ordering is closed. See <a href="/locations">Locations</a>.</p>
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
          <CartSummary />
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
            {PUPUSAS.map((item) => (
              <PupusaCard
                key={item.id}
                item={item}
                market={market}
                sides={SIDES}
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
            {LEMONADES.map(drink => (
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
