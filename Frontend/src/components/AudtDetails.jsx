import React, { useState, useEffect } from 'react';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import Cards from './Cards';

function Freebook() {
    const [auditoriums, setAuditoriums] = useState([]);

    useEffect(() => {
        // Fetch the list.json file from the public folder
        fetch('/list.json')
            .then((response) => response.json())
            .then((data) => {
                setAuditoriums(data.auditoriums); // Assuming your data has an "auditoriums" array
            })
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 3,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true,
                },
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                },
            },
        ],
    };

    return (
        <div className="max-w-screen-2xl container mx-auto md:px-20 px-4">
            <div>
                <h1 className="font-semibold text-xl pb-2">Take a Look at Our Spaces</h1>
                <p>
                    Discover our beautifully designed auditoriums, crafted for events of all kinds—from inspiring seminars to grand cultural performances. Each space combines modern amenities with elegant design, ensuring a memorable experience for every occasion.
                </p>
            </div>
            <div className="mt-4">
                {auditoriums.length > 0 ? (
                    <Slider {...settings}>
                        {auditoriums.map((item) => (
                            <Cards item={item} key={item.id} />
                        ))}
                    </Slider>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}

export default Freebook;
