import React, { useEffect, useMemo, useState } from "react";

/* format helpers */
const fmtDate = (iso) => new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const fmtDT   = (iso) => new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/* session */
function useSession() {
  const [authed, setAuthed] = useState(null);
  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);
  return authed;
}

/* login */
function Login({ onOk }) {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });
    if (r.ok) onOk();
    else {
      const j = await r.json().catch(()=>({}));
      setErr(j.error || "Login failed");
    }
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 420 }}>
        <h1>Admin Login</h1>
        <form className="card" style={{ padding: 16 }} onSubmit={submit}>
          <label>Username</label>
          <input value={username} onChange={e=>setU(e.target.value)} />
          <label style={{marginTop:8}}>Password</label>
          <input type="password" value={password} onChange={e=>setP(e.target.value)} />
          {err && <div className="err" style={{marginTop:8}}>{err}</div>}
          <button className="btn btn-primary" style={{marginTop:12}}>Sign in</button>
        </form>
      </div>
    </main>
  );
}

/* mini bar chart */
function Bars({ daily }) {
  const max = Math.max(0, ...daily.map(d => Number(d.total_cents || 0)));
  if (max <= 0) return <div className="muted" style={{ padding: "8px 0" }}>No paid orders in this range.</div>;
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 6, height: 120, padding: "8px 0" }}>
      {daily.map((d, i) => {
        const val = Number(d.total_cents || 0);
        const h = (val / max) * 100;
        const label = new Date(d.day).toLocaleDateString([], { month: "short", day: "numeric" });
        return (
          <div key={i} style={{ textAlign: "center", width: 16 }}>
            <div title={`$${(val/100).toFixed(2)} • ${label}`} style={{
              width: 16, height: `${h}%`, background: "var(--primary, #f0ae1c)", borderRadius: 6
            }} />
            <div style={{ fontSize: 10, marginTop: 4 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* orders view */
function OrdersView({ occ, onBack }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setData(null); setErr("");
    const u = new URL("/api/admin/orders/by-occurrence", window.location.origin);
    u.searchParams.set("marketId", occ.marketId);
    u.searchParams.set("startISO", occ.startISO);
    fetch(u, { credentials: "include" })
      .then(r => r.ok ? r.json() : r.json().then(j => Promise.reject(new Error(j.error || `HTTP ${r.status}`))))
      .then(setData)
      .catch(e => setErr(e.message));
  }, [occ]);

  const totals = data?.totals;
  const orders = data?.orders || [];

  const csvHref = useMemo(() => {
    const u = new URL("/api/admin/orders/by-occurrence.csv", window.location.origin);
    u.searchParams.set("marketId", occ.marketId);
    u.searchParams.set("startISO", occ.startISO);
    return u.toString();
  }, [occ]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row between align-center">
        <h3>Orders • {occ.name} • {fmtDT(occ.startISO)}</h3>
        <div className="row" style={{ gap: 8 }}>
          <a className="btn btn-secondary" href={csvHref} target="_blank" rel="noreferrer">Download CSV</a>
          <button className="btn" onClick={onBack}>Back</button>
        </div>
      </div>

      {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
      {!err && !data && <div className="muted">Loading…</div>}

      {data && (
        <>
          <div className="row" style={{ gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            <div className="pill">Orders: {totals.orders}</div>
            <div className="pill">Subtotal: ${(totals.subtotal_cents/100).toFixed(2)}</div>
            <div className="pill">Tip: ${(totals.tip_cents/100).toFixed(2)}</div>
            <div className="pill">Total: ${(totals.total_cents/100).toFixed(2)}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            {orders.length === 0 ? (
              <div className="muted">No paid orders yet for this occurrence.</div>
            ) : (
              <div className="summary-list">
                {orders.map(({order, items}) => (
                  <div key={order.id} className="summary-item" style={{ alignItems: "flex-start" }}>
                    <div className="desc">
                      <div className="title">
                        {order.customer_name || "Customer"} • {fmtTime(order.pickup_slot)}
                      </div>
                      <div className="meta tiny">
                        {order.customer_phone || "—"} • {order.customer_email || "—"} • #{order.id.slice(0,8)}
                      </div>
                      <ul className="muted" style={{ marginTop: 6 }}>
                        {items.map(it => (
                          <li key={it.id} style={{ marginBottom: 4 }}>
                            <strong>{it.title}</strong> × {it.quantity}
                            {it.sides?.length ? <> — Sides: {it.sides.map(s=>s.title||s.side_id).join(", ")}</> : null}
                            {it.notes ? <> — Notes: “{it.notes}”</> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="right">
                      <div className="line">Total ${(order.total_cents/100).toFixed(2)}</div>
                      <div className="muted tiny">Tip ${(order.tip_cents/100).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MarketCard({ row, onToggle, onOrders }) {
  const isOpen = !!row.isOpen;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row between align-center">
        <h3 className="heading" style={{ margin: 0 }}>{row.name}</h3>
        <span className={`pill ${isOpen ? "success" : "muted"}`}>{isOpen ? "Open" : "Closed"}</span>
      </div>
      <div className="muted" style={{ marginTop: 4 }}>
        {fmtDate(row.startISO)} • {fmtTime(row.startISO)}–{fmtTime(row.endISO)}
      </div>

      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button
          className={`btn ${isOpen ? "btn-secondary" : "btn-primary"}`}
          onClick={() => onToggle(row)}
        >
          {isOpen ? "Close next" : "Open next"}
        </button>

        <button
          className="btn"
          disabled={!isOpen}
          title={isOpen ? "View orders for this occurrence" : "Open this occurrence to view incoming orders"}
          onClick={() => onOrders(row)}
          style={!isOpen ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
        >
          View orders
        </button>
      </div>
    </div>
  );
}


export default function Admin() {
  const authed = useSession();

  // sales filters
  const [range, setRange] = useState("30d");
  const [marketFilter, setMarketFilter] = useState("");

  // sales data
  const [stats, setStats] = useState(null);
  const [errStats, setErrStats] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);

  // next occurrences
  const [status, setStatus] = useState([]);
  const [errStatus, setErrStatus] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);

  // orders view
  const [occ, setOcc] = useState(null);

  async function loadStatus() {
    try {
      setLoadingStatus(true); setErrStatus("");
      const r = await fetch("/api/markets/admin/status", { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json(); // { now, markets: [...] }
      const list = Array.isArray(data.markets) ? data.markets : [];
      // sort by soonest start time first
      list.sort((a,b) => new Date(a.startISO) - new Date(b.startISO));
      setStatus(list);
    } catch (e) {
      setErrStatus(e.message);
      setStatus([]);
    } finally {
      setLoadingStatus(false);
    }
  }

  async function loadStats() {
    try {
      setLoadingStats(true); setErrStats("");
      const u = new URL("/api/admin/stats/revenue", window.location.origin);
      u.searchParams.set("range", range);
      if (marketFilter) u.searchParams.set("marketId", marketFilter);
      const r = await fetch(u, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setStats(data);
    } catch (e) {
      setErrStats(e.message);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => { if (authed === true) loadStatus(); }, [authed]);
  useEffect(() => { if (authed === true) loadStats(); }, [authed, range, marketFilter]);

  async function toggle(row) {
    setErrStatus("");
    const r = await fetch("/api/markets/admin/open-next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ marketId: row.marketId, open: !row.isOpen })
    });
    if (!r.ok) {
      const j = await r.json().catch(()=>({}));
      setErrStatus(j.error || "Failed to toggle");
    } else {
      await loadStatus();
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  }

  // build market filter options from whatever we have (safe even if empty)
  const marketOptions = useMemo(() => {
    const map = new Map();
    (status || []).forEach(s => map.set(s.marketId, s.name));
    return Array.from(map.entries()).map(([id,name]) => ({ id, name }));
  }, [status]);

  const daily = stats?.daily || [];
  const grand = stats?.grand || { orders:0, subtotal_cents:0, tip_cents:0, total_cents:0 };

  // ------- render body based on auth state (AFTER all hooks) -------
  let body = null;

  if (authed === null) {
    body = <p>Loading…</p>;
  } else if (authed === false) {
    body = <Login onOk={() => window.location.reload()} />;
  } else {
    body = (
      <>
        <div className="row between align-center" style={{ marginBottom: 12 }}>
          <h1>Admin</h1>
          <button className="btn" onClick={logout}>Log out</button>
        </div>

        {/* Sales */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="row between align-center" style={{ gap: 12, flexWrap: "wrap" }}>
            <h3>Sales</h3>
            <div className="row" style={{ gap: 8 }}>
              {["1d","7d","30d","90d","180d","365d"].map(k => (
                <button key={k} className={`chip ${range===k ? "active" : ""}`} onClick={()=>setRange(k)}>{k}</button>
              ))}
              <select value={marketFilter} onChange={e=>setMarketFilter(e.target.value)}>
                <option value="">All markets</option>
                {marketOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          {errStats && <div className="err" style={{ marginTop: 8 }}>{errStats}</div>}
          {loadingStats && !errStats && <div className="muted">Loading…</div>}

          {stats && !loadingStats && !errStats && (
            <>
              <div className="row" style={{ gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                <div className="pill">Orders: {grand.orders}</div>
                <div className="pill">Subtotal: ${(grand.subtotal_cents/100).toFixed(2)}</div>
                <div className="pill">Tip: ${(grand.tip_cents/100).toFixed(2)}</div>
                <div className="pill">Total: ${(grand.total_cents/100).toFixed(2)}</div>
              </div>
              <Bars daily={daily} />
            </>
          )}
        </div>

        {/* Next 4 occurrences */}
        <div className="card" style={{ padding: 16 }}>
          <div className="row between align-center">
            <h3>Next Occurrences</h3>
            <button className="btn" onClick={loadStatus}>Refresh</button>
          </div>

          {errStatus && <div className="err" style={{ marginTop: 8 }}>{errStatus}</div>}
          {!errStatus && loadingStatus && <div className="muted">Loading…</div>}
          {!errStatus && !loadingStatus && status.length === 0 && (
            <div className="muted">No markets configured.</div>
          )}

          {!errStatus && !loadingStatus && status.length > 0 && (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 12 }}>
              {status.map(row => (
                <MarketCard
                  key={`${row.marketId}-${row.startISO}`}
                  row={row}
                  onToggle={toggle}
                  onOrders={(r) => setOcc({ marketId: r.marketId, name: r.name, startISO: r.startISO })}
                />
              ))}
            </div>
          )}
        </div>

        {occ && (
          <div style={{ marginTop: 16 }}>
            <OrdersView occ={occ} onBack={() => setOcc(null)} />
          </div>
        )}
      </>
    );
  }

  return (
    <main className="section">
      <div className="container">
        {body}
      </div>
    </main>
  );
}
