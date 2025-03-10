import React from "react";
import MenuCard from "../components/MenuCard.jsx";
import "../styles/menu-styles.css";

const pupusaData = [
    {
        foodName: "Cheese Pupusa",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Bean & Cheese Pupusa",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Pork, Bean, & Cheese Pupusa",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Vegetables & Cheese Pupusa",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Loroco & Cheese Pupusa",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Pork & Cheese Pupusa",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
];

const lemonadeData = [
    {
        foodName: "Regular Lemonade",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Strawberry Lemonade",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Watermelon Lemonade",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Four Berry Lemonade",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Cucumber Lemonade",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Mango Lemonade",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Pineapple Passion Fruit Lemonade",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    }
];

const sideData = [
    {
        foodName: "Curtido",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Salsa",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Creamy Guacamole",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
    {
        foodName: "Sour Cream",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quam neque, 
                    scelerisque luctus pellentesque bibendum, elementum a metus. Nulla et tempor magna. 
                    Donec sed rutrum dui. Vestibulum ut sollicitudin nibh. Donec rhoncus eget massa non 
                    ullamcorper. Aenean consectetur ex ex, non fringilla mauris dignissim ut. Vivamus 
                    consequat nisl eu turpis accumsan vestibulum. `,
    },
];

function Menu() {
    return (
        <section className="menu">
            <div className="menu-container">
                <h1>Menu</h1>
                <h2 className="section-title">Pupusas</h2>
                <div className="menu-section">
                    {pupusaData.map((pupusa, index) => (
                    <MenuCard key={index} {...pupusa} />
                    ))}
                </div>
                <h2 className="section-title">Fresh Squeezed Lemonades</h2>
                <div className="menu-section">
                    {lemonadeData.map((lemonade, index) => (
                    <MenuCard key={index} {...lemonade} />
                    ))}
                </div>
                <h2 className="section-title">Sides</h2>
                <div className="menu-section">
                    {sideData.map((side, index) => (
                    <MenuCard key={index} {...side} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Menu;