// src/pages/Menu.jsx
import React from "react";
import "../App.css";     // global styles
import "../styles/home.css";     // shared helpers/components from Home (cards, buttons, grid, etc.)
import "../styles/menu-styles.css";     // menu-specific styles (hero + tabs)

const pupusas = [
  { title: "Cheese Pupusa", img: "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop", desc: "Hand-pressed masa stuffed with melty queso.", badge: "Bestseller", price: "$4.50" },
  { title: "Bean & Cheese Pupusa", img: "https://images.unsplash.com/photo-1606756790138-261d2b21cd1b?q=80&w=1200&auto=format&fit=crop", desc: "Creamy refried beans with queso for the perfect combo.", badge: "Vegetarian", price: "$4.75" },
  { title: "Pork, Bean, & Cheese Pupusa", img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop", desc: "Slow-braised pork with beans & cheese—hearty and satisfying.", price: "$5.25" },
  { title: "Vegetables & Cheese Pupusa", img: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop", desc: "Seasonal vegetables folded into masa with queso.", price: "$4.95" },
  { title: "Loroco & Cheese Pupusa", img: "https://images.unsplash.com/photo-1546549039-b3429f7df3fb?q=80&w=1200&auto=format&fit=crop", desc: "Floral loroco buds meet melty cheese—the Salvadoran classic.", badge: "Signature", price: "$5.25" },
  { title: "Pork & Cheese Pupusa", img: "https://images.unsplash.com/photo-1604908176997-43162f8d7ecd?q=80&w=1200&auto=format&fit=crop", desc: "Slow-cooked pork with queso; rich and savory.", price: "$5.00" },
];

const lemonades = [
  { title: "Regular Lemonade", img: "https://images.unsplash.com/photo-1556679343-c7306c02af05?q=80&w=1200&auto=format&fit=crop", desc: "Fresh-squeezed, lightly sweet, perfectly tart.", price: "$4.00" },
  { title: "Strawberry Lemonade", img: "https://images.unsplash.com/photo-1556679340-3cbd3ef9ae2c?q=80&w=1200&auto=format&fit=crop", desc: "Real strawberries blended in for a juicy finish.", badge: "Fan Favorite", price: "$4.75" },
  { title: "Watermelon Lemonade", img: "https://images.unsplash.com/photo-1623065425904-5e2d1d9f5c70?q=80&w=1200&auto=format&fit=crop", desc: "Summer in a cup—light and refreshing.", price: "$4.75" },
  { title: "Four Berry Lemonade", img: "https://images.unsplash.com/photo-1564679820130-79a3dbe5cf6c?q=80&w=1200&auto=format&fit=crop", desc: "Strawberry, blueberry, blackberry, raspberry.", price: "$4.95" },
  { title: "Cucumber Lemonade", img: "https://images.unsplash.com/photo-1556679344-2484f0b2d830?q=80&w=1200&auto=format&fit=crop", desc: "Crisp cucumber + mint notes. Ultra refreshing.", price: "$4.50" },
  { title: "Mango Lemonade", img: "https://images.unsplash.com/photo-1541976076758-347942db1977?q=80&w=1200&auto=format&fit=crop", desc: "Tropical & bright with real mango.", price: "$4.95" },
  { title: "Pineapple Passion Fruit", img: "https://images.unsplash.com/photo-1627662057419-73a31779042f?q=80&w=1200&auto=format&fit=crop", desc: "Tangy pineapple with a fragrant passion fruit twist.", price: "$5.25" },
];

const sides = [
  { title: "Curtido", img: "https://images.unsplash.com/photo-1604908554129-b308cd4b8b9f?q=80&w=1200&auto=format&fit=crop", desc: "Pickled cabbage slaw—bright, tangy, essential.", price: "$2.50" },
  { title: "Salsa", img: "https://images.unsplash.com/photo-1582456891925-9bdbd9e8b421?q=80&w=1200&auto=format&fit=crop", desc: "House red salsa with a gentle kick.", price: "$1.50" },
  { title: "Creamy Guacamole", img: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?q=80&w=1200&auto=format&fit=crop", desc: "Smooth, limey, and super scoopable.", price: "$3.95" },
  { title: "Sour Cream", img: "https://images.unsplash.com/photo-1590080875631-95a10f16fcfc?q=80&w=1200&auto=format&fit=crop", desc: "Cool & creamy add-on.", price: "$1.25" },
];

function ItemCard({ title, img, desc, price, badge }) {
  return (
    <article className="card">
      <div className="card-media media-16x11">
        <img src={img} alt={title} />
        {badge ? <span className="tag">{badge}</span> : null}
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="muted text-normal">{desc}</p>
        <div className="row between align-center">
          <span className="price">{price}</span>
          <a href="/order" className="btn btn-secondary">Add</a>
        </div>
      </div>
    </article>
  );
}

function Menu() {
  return (
    <main className="menu-page">

      {/* Small hero intro */}
      <section className="menu-hero">
        <div className="container center">
          <span className="pill">Our Food</span>
          <h1 className="menu-hero-title">Menu</h1>
          <p className="menu-hero-subtitle">
            Hand-pressed pupusas, fresh-squeezed lemonades, and classic sides.
          </p>
          <div className="hero-cta">
            <a href="#pupusas" className="btn btn-secondary">Pupusas</a>
            <a href="#lemonades" className="btn btn-secondary">Lemonades</a>
            <a href="#sides" className="btn btn-secondary">Sides</a>
            <a href="/order" className="btn btn-primary">Order Now</a>
          </div>
        </div>
      </section>

      {/* Pupusas */}
      <section id="pupusas" className="section">
        <div className="container">
          <header className="row between align-center section-head">
            <div>
              <h2 className="heading">Pupusas</h2>
              <p className="muted">Hand-pressed to order. Served with curtido & salsa.</p>
            </div>
            <a href="/order" className="btn btn-primary">Order Now</a>
          </header>

          <div className="grid grid-cards">
            {pupusas.map((item, i) => <ItemCard key={item.title + i} {...item} />)}
          </div>
        </div>
      </section>

      {/* Lemonades */}
      <section id="lemonades" className="section section-alt">
        <div className="container">
          <header className="row between align-center section-head">
            <div>
              <h2 className="heading">Fresh-Squeezed Lemonades</h2>
              <p className="muted">Made daily, real fruit only.</p>
            </div>
          </header>

          <div className="grid grid-cards">
            {lemonades.map((item, i) => <ItemCard key={item.title + i} {...item} />)}
          </div>
        </div>
      </section>

      {/* Sides */}
      <section id="sides" className="section">
        <div className="container">
          <header className="row between align-center section-head">
            <div>
              <h2 className="heading">Sides</h2>
              <p className="muted">Round out your order.</p>
            </div>
          </header>

          <div className="grid grid-cards">
            {sides.map((item, i) => <ItemCard key={item.title + i} {...item} />)}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Menu;