import React from 'react';
import '../styles/location-card.css';

function LocationCard({ title, day, hours, offering, address }) {
  return (
    <div className="location-card">
      <h2>{title}</h2>
      <h3>{day}</h3>
      <p><strong>Hours: </strong>{hours}</p>
      <p><strong>Offering: </strong>{offering}</p>
      <p><strong>Address: </strong>{address}</p>
    </div>
  );
}

export default LocationCard;