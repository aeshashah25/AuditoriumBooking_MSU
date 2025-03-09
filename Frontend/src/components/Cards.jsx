import React from 'react';

function Cards({ item }) {
    return (
        <div className="card bg-base-100 w-96 shadow-xl hover:shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer mb-4 dark:bg-slate-900 dark:text-white dark:border">
            <figure>
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                />
            </figure>
            <div className="card-body">
    <h2 className="card-title">{item.name}</h2>
    <p>{item.title}</p>
    <p className="text-brown-dark dark:text-white">{item.location}</p> {/* Displaying the location */}
</div>

        </div>
    );
}

export default Cards;
