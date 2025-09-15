// src/pages/Home.jsx
import "../App.css";            // keep your global styles
import "../styles/home.css";            // NEW: page-specific styles
import { useEffect, useRef } from "react";

function Home() {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play?.().catch(() => {});
  }, []);

  const favorites = [
    {
      title: "Classic Pork Pupusa",
      img: "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop",
      desc: "Hand-pressed masa stuffed with slow-cooked pork & cheese.",
      tag: "Bestseller",
    },
    {
      title: "Cheese & Loroco",
      img: "https://images.unsplash.com/photo-1606756790138-261d2b21cd1b?q=80&w=1200&auto=format&fit=crop",
      desc: "Floral loroco buds with melty queso—Salvadoran classic.",
      tag: "Vegetarian",
    },
    {
      title: "House Horchata",
      img: "https://images.unsplash.com/photo-1625944528430-1d0ef8a5b02e?q=80&w=1200&auto=format&fit=crop",
      desc: "Cold, creamy, cinnamon-kissed. Made fresh daily.",
      tag: "Most Loved",
    },
  ];

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <video
          ref={videoRef}
          className="hero-video"
          src="https://videos.pexels.com/video-files/2798556/2798556-uhd_2560_1440_25fps.mp4"
          poster="https://images.unsplash.com/photo-1542831371-d531d36971e6?q=80&w=1600&auto=format&fit=crop"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="hero-overlay" />
        <div className="hero-content container">
          <span className="pill">Handmade • Fresh • Authentic</span>
          <h1 className="hero-title">Crafted with Tradition. Served with Heart.</h1>
          <p className="hero-subtitle">
            From sizzling griddles to steamy fillings, every bite is made to order. Order ahead for pickup
            or explore the menu—your next favorite meal starts here.
          </p>
          <div className="hero-cta">
            <a href="/order" className="btn btn-primary">Order Now</a>
            <a href="/menu" className="btn btn-secondary">View Menu →</a>
          </div>
          <div className="hero-meta">Northridge, CA • Tue • Thu • Sat • Sun • (818) 555-1234</div>
        </div>
      </section>

      {/* GUEST FAVORITES */}
      <section className="section">
        <div className="container">
          <div className="row between align-center section-head">
            <div>
              <h2 className="heading">Guest Favorites</h2>
              <p className="muted">A quick taste of what people love most.</p>
            </div>
            <a href="/menu" className="btn btn-outline">Explore full menu →</a>
          </div>

          <div className="grid grid-cards">
            {favorites.map((item) => (
              <article key={item.title} className="card">
                <div className="card-media media-16x11">
                  <img src={item.img} alt={item.title} />
                  <span className="tag">{item.tag}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="muted">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="section section-alt">
        <div className="container">
          <div className="grid grid-split">
            <div className="img-frame">
              <img
                src="https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1600&auto=format&fit=crop"
                alt="Handmade on the griddle"
              />
            </div>
            <div>
              <h2 className="heading">Handmade, Every Time</h2>
              <p className="text-normal muted">
                We grew up on the flavors of home—masa, loroco, curtido, and slow-braised fillings. Our kitchen keeps
                that tradition alive, serving fresh, made-to-order meals you can taste in every bite.
              </p>
              <div className="chips">
                <span className="chip">Family-owned</span>
                <span className="chip">Fresh Daily</span>
                <span className="chip">Local Ingredients</span>
              </div>
              <div className="row">
                <a href="/about" className="btn btn-primary">Our Story</a>
                <a href="/gallery" className="btn btn-secondary">See the kitchen</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MENU PREVIEW */}
      <section className="section">
        <div className="container">
          <div className="row between align-center section-head">
            <div>
              <h2 className="heading">Menu Highlights</h2>
              <p className="muted">A little something for everyone.</p>
            </div>
            <div className="row wrap">
              {["All", "Pupusas", "Sides", "Drinks"].map((f, i) => (
                <button key={f} className={i === 0 ? "btn btn-primary" : "btn btn-secondary"}>{f}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-mini">
            {[1, 2, 3, 4].map((i) => (
              <article key={i} className="card">
                <img
                  src={`https://picsum.photos/seed/menu-${i}/640/420`}
                  alt={`Menu item ${i}`}
                  className="card-thumb"
                />
                <div className="card-body">
                  <div className="row between align-center">
                    <h3 className="card-title">Sample Dish {i}</h3>
                    <div className="rating">★ 4.{7 - (i % 3)}</div>
                  </div>
                  <p className="muted small">Short, crave-worthy description with key ingredients.</p>
                  <div className="row between align-center">
                    <span className="price">$10.{(i + 1) * 2}</span>
                    <a href="/order" className="btn btn-secondary">Add</a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="center">
            <a href="/menu" className="btn btn-primary">View Full Menu</a>
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="section section-alt">
        <div className="container">
          <div className="center">
            <h2 className="heading">Visit Us</h2>
            <p className="muted">Four market days a week—come say hi!</p>
          </div>
          <div className="grid grid-split">
            <article className="card">
              <div className="card-body">
                <h3 className="card-title">Main Stall — Northridge</h3>
                <div className="muted">12345 Reseda Blvd, Northridge, CA</div>
                <div className="muted">Tue, Thu, Sat & Sun • 9:00a – 3:00p</div>
                <div className="muted">(818) 555-1234</div>
                <div className="map-placeholder">
                  Simple map placeholder — embed Google Maps iframe here.
                </div>
                <div className="row">
                  <a href="/order" className="btn btn-primary">Order for Pickup</a>
                  <a href="/locations" className="btn btn-secondary">All Locations</a>
                </div>
              </div>
            </article>
            <div className="img-frame">
              <img
                src="https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?q=80&w=1600&auto=format&fit=crop"
                alt="Market stall ambiance"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="container">
          <div className="center">
            <h2 className="heading">What People Say</h2>
            <p className="muted">Real words from happy guests.</p>
          </div>
          <div className="grid grid-cards">
            {["Best pupusas I've had.", "Worth the wait every time!", "Horchata is unreal—get the large."].map((q) => (
              <article key={q} className="card">
                <div className="card-body">
                  <div className="rating">★★★★★</div>
                  <p>“{q}”</p>
                  <div className="muted small">— Local Guide</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER / CONTACT */}
      <section className="section section-dark">
        <div className="container">
          <div className="grid grid-split">
            <div>
              <h2 className="heading light">Join the insiders list</h2>
              <p className="muted light">
                Get market day reminders, pop-up announcements, and exclusive specials.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="row wrap">
                <input type="email" placeholder="you@email.com" className="input" />
                <button type="submit" className="btn btn-primary">Subscribe</button>
              </form>
              <div className="muted small light">We respect your inbox. Unsubscribe anytime.</div>
            </div>
            <div className="card glass">
              <div className="card-body">
                <h3 className="card-title light">Have a question or catering inquiry?</h3>
                <textarea placeholder="Tell us about your event or question…" rows={5} className="textarea" />
                <div className="row">
                  <input placeholder="Your name" className="input" />
                  <input placeholder="Phone" className="input" />
                </div>
                <div>
                  <button className="btn btn-secondary">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="brand">Deisy’s Tasty Food</div>
          <nav className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/careers">Careers</a>
          </nav>
          <div className="muted small">© {new Date().getFullYear()} All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
