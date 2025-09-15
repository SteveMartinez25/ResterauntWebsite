import React from "react";

function googleMapsLink(addr) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

function LocationCard({ title, day, hours, offering, address }) {
  return (
    <article className="card location-card">
      <div className="card-body">
        <div className="day-badge">{day}</div>
        <h3 className="card-title light">{title}</h3>

        <p className="location-row"><span className="label">Hours:</span> {hours}</p>
        <p className="location-row"><span className="label">Offering:</span> {offering}</p>
        <p className="location-row"><span className="label">Address:</span> {address}</p>

        <div className="row">
          <a
            className="btn btn-light"
            href={googleMapsLink(address)}
            target="_blank"
            rel="noreferrer"
          >
            Get Directions
          </a>
        </div>
      </div>
    </article>
  );
}

export default LocationCard;