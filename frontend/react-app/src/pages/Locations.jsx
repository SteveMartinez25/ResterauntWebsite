import React from "react";
import LocationCard from "../components/LocationCard.jsx";
import "../styles/location-styles.css";

const locationsData = [
    {
      title: "Manhattan Beach Farmer's Market",
      day: "Tuesday",
      hours: "11 AM - 3 PM",
      offering: "Pupusas & Lemonades",
      address: "Civic Center, Upper Parking Lot Plaza,\n320 15th St,\nManhattan Beach, CA 90266"
    },
    {
      title: "South Pasadena Farmer's Market",
      day: "Thursday",
      hours: "3 PM - 7 PM",
      offering: "Pupusas & Lemonades",
      address: "920 Meridian Ave,\nSouth Pasadena, CA 91030"
    },
    {
      title: "Torrance Certified Farmer's Market",
      day: "Saturday",
      hours: "8 AM - 1 PM",
      offering: "Fresh Squeezed Lemonades",
      address: "2200 Crenshaw Blvd,\nTorrance, CA 90501"
    },
    {
      title: "Westchester Farmer's Market",
      day: "Sunday",
      hours: "9 AM - 1:30 PM",
      offering: "Pupusas & Lemonades",
      address: "6200 W 87th St,\nLos Angeles, CA 90045"
    }
];


function Locations() {
    return (
        <>
            <section className="locations-welcome">
                <h1>Locations</h1>
            </section>
            <section className="location-section">
                <div className="location-main-container">
                    <div className="cards-container">
                    {locationsData.map((location, index) => (
                    <LocationCard key={index} {...location} />
                    ))}
                    </div>
                    <div className="map-containter">
                        <iframe className="map" src="https://www.google.com/maps/d/embed?mid=1Zzz6UVkH4KJl7ELstVSo4u4xJepLhnY&ehbc=2E312F"></iframe>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Locations;