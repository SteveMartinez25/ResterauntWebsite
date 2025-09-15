import React from "react";
import "../App.css";       // global
import "../styles/home.css";       // shared helpers (container, section, card, btn…)
import "../styles/location-styles.css";  // page-specific styles
import LocationCard from "../components/LocationCard.jsx";

const locationsData = [
  {
    title: "Manhattan Beach Farmer's Market",
    day: "Tuesday",
    hours: "11 AM – 3 PM",
    offering: "Pupusas & Lemonades",
    address: "Civic Center, Upper Parking Lot Plaza, 320 15th St, Manhattan Beach, CA 90266",
  },
  {
    title: "South Pasadena Farmer's Market",
    day: "Thursday",
    hours: "3 PM – 7 PM",
    offering: "Pupusas & Lemonades",
    address: "920 Meridian Ave, South Pasadena, CA 91030",
  },
  {
    title: "Torrance Certified Farmer's Market",
    day: "Saturday",
    hours: "8 AM – 1 PM",
    offering: "Fresh Squeezed Lemonades",
    address: "2200 Crenshaw Blvd, Torrance, CA 90501",
  },
  {
    title: "Westchester Farmer's Market",
    day: "Sunday",
    hours: "9 AM – 1:30 PM",
    offering: "Pupusas & Lemonades",
    address: "6200 W 87th St, Los Angeles, CA 90045",
  },
];

function Locations() {
  return (
    <main className="locations-page">
      {/* Mini hero */}
      <section className="locations-hero">
        <div className="container center">
          <span className="pill">Find Us Weekly</span>
          <h1 className="locations-hero-title">Locations</h1>
          <p className="locations-hero-subtitle">
            Catch us at farmers’ markets across LA. Fresh pupusas, lemonade, and good vibes.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cards">
            {locationsData.map((loc, i) => (
              <LocationCard key={loc.title + i} {...loc} />
            ))}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="section section-alt">
        <div className="container">
          <div className="row between align-center section-head">
            <h2 className="heading">Map</h2>
            <a
              className="btn btn-primary"
              href="https://www.google.com/maps/d/embed?mid=1Zzz6UVkH4KJl7ELstVSo4u4xJepLhnY"
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
          <div className="map-container">
            <iframe
              className="map"
              src="https://www.google.com/maps/d/embed?mid=1Zzz6UVkH4KJl7ELstVSo4u4xJepLhnY&ehbc=2E312F"
              title="Deisy’s Tasty Food Locations"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
 export default Locations;