// src/App.jsx
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./pages/CartContext.jsx";  // ← correct path

import NavBar from "./components/NavBar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import Locations from "./pages/Locations.jsx";
import About from "./pages/About.jsx";
import Order from "./pages/Order.jsx";
import Checkout from "./pages/Checkout.jsx";
import Confirm from "./pages/Confirm.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/about" element={<About />} />
          <Route path="/order" element={<Order />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/confirmation" element={<OrderConfirmation />} />
          <Route path="/confirm" element={<Confirm />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </CartProvider>
  );
}
