// src/pages/About.jsx
import React from "react";
import "../App.css";   // global
import "../styles/home.css";   // shared helpers (container, section, grid, card, btn…)
import "../styles/about.css";  // page-specific styles

export default function About() {
  const values = [
    {
      title: "Handmade Masa",
      img: "https://images.unsplash.com/photo-1586201375761-83865001e31b?q=80&w=1200&auto=format&fit=crop",
      desc: "We mix and press fresh masa every day for that soft, toasty bite.",
    },
    {
      title: "Slow-Braised Fillings",
      img: "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop",
      desc: "From pork to veggies, our fillings are cooked low and slow for real depth.",
    },
    {
      title: "Fresh Sides & Salsas",
      img: "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=1200&auto=format&fit=crop",
      desc: "Curtido, salsa, and house drinks are prepped daily—no shortcuts.",
    },
  ];

  return (
    <main className="about-page">
      {/* Mini hero */}
      <section className="about-hero">
        <div className="container about-hero-inner">
          <span className="pill">Our Story</span>
          <h1 className="about-hero-title">About Us</h1>
          <p className="about-hero-subtitle">
            Family-run, market-born. We serve handmade pupusas, fresh drinks, and warm hospitality.
          </p>
          <div className="hero-cta">
            <a href="/menu" className="btn btn-primary">View Menu</a>
            <a href="/locations" className="btn btn-secondary">Where to find us</a>
          </div>
        </div>
      </section>

      {/* Story split */}
      <section className="section">
        <div className="container">
          <div className="grid grid-split">
            <div className="img-frame">
              <img
                src="https://images.unsplash.com/photo-1514511547117-f9c3c5b8b16e?q=80&w=1600&auto=format&fit=crop"
                alt="Family cooking together"
              />
            </div>
            <div>
              <h2 className="heading">From Home Kitchen to Farmers’ Markets</h2>
              <p className="muted text-normal">
                We started as a small family project, sharing recipes passed down through generations.
                Today, we cook the same way: by hand, with patience, and with the kind of care you can taste.
              </p>
              <div className="chips">
                <span className="chip">Family-owned</span>
                <span className="chip">Made Fresh Daily</span>
                <span className="chip">Local Ingredients</span>
              </div>
              <div className="row">
                <a href="/about#values" className="btn btn-secondary">Our values</a>
                <a href="/order" className="btn btn-primary">Order now</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values / what we stand for */}
      <section id="values" className="section section-alt">
        <div className="container">
          <h2 className="heading center">What We Stand For</h2>
          <p className="muted center">Simple ingredients, careful technique, and consistency—every single time.</p>

          <div className="grid grid-cards about-values">
            {values.map((v) => (
              <article key={v.title} className="card">
                <div className="card-media media-16x11">
                  <img src={v.img} alt={v.title} />
                </div>
                <div className="card-body">
                  <h3 className="card-title">{v.title}</h3>
                  <p className="muted text-normal">{v.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div className="container">
          <div className="grid about-stats">
            <div className="stat">
              <div className="stat-number">2019</div>
              <div className="muted">Founded</div>
            </div>
            <div className="stat">
              <div className="stat-number">4</div>
              <div className="muted">Weekly markets</div>
            </div>
            <div className="stat">
              <div className="stat-number">100k+</div>
              <div className="muted">Pupusas served</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-alt">
        <div className="container">
          <h2 className="heading">FAQ</h2>
          <div className="about-faq">
            <details>
              <summary>Do you offer vegetarian options?</summary>
              <p>Yes—Cheese & Loroco and Veggies & Cheese are guest favorites.</p>
            </details>
            <details>
              <summary>Do you cater?</summary>
              <p>We do! Send details via the contact form on the home page and we’ll reply quickly.</p>
            </details>
            <details>
              <summary>Which days are you open?</summary>
              <p>Check the <a href="/locations">Locations</a> page—our schedule is posted weekly.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container center">
          <h2 className="heading">Hungry?</h2>
          <p className="muted">Order ahead or come say hi at a market near you.</p>
          <div className="hero-cta">
            <a href="/order" className="btn btn-primary">Order Now</a>
            <a href="/menu" className="btn btn-secondary">Browse Menu</a>
          </div>
        </div>
      </section>
    </main>
  );
}
