import React from "react";
import "../styles/menu-card.css";

function MenuCard({foodName, description}) {
    return (
        <div className="menu-item">
            <img className="food-pic" src="../assets/pupusa.jpg" alt={foodName}/>
            <h3>{foodName}</h3>
            <p>{description}</p>
        </div>
    );
};

export default MenuCard;