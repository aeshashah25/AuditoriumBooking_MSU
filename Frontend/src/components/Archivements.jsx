import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css"; 

function Achievements() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="bg-gray-100 py-10 px-5 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto bg-white shadow-md p-6 dark:bg-slate-900 dark:text-white">
        <h1 className="text-3xl font-bold text-center text-brown mb-6 dark:text-white">Achievements</h1>
        
        <Slider {...settings}>
          {/* Achievement 1 */}
          <div className="bg-brown-100 p-6 rounded-lg shadow-md dark:bg-slate-900 dark:border-gray-600 sm:border sm:border-2 md:border-4 lg:border-8">
            <h3 className="text-2xl font-semibold text-brown mb-3 dark:text-white">1000+ Events Organized</h3>
            <p className="text-gray-700 dark:text-gray-300">We have successfully hosted over 1000 events, ranging from seminars to large conferences, ensuring every event is managed seamlessly.</p>
          </div>

          {/* Achievement 2 */}
          <div className="bg-brown-100 p-6 rounded-lg shadow-md dark:bg-slate-900 dark:border dark:border-gray-600 sm:border sm:border-2 md:border-4 lg:border-8">
            <h3 className="text-2xl font-semibold text-brown mb-3 dark:text-white">500+ Happy Clients</h3>
            <p className="text-gray-700 dark:text-gray-300">Our platform has helped over 500 clients book auditoriums for various events, ensuring their satisfaction every time.</p>
          </div>

          {/* Achievement 3 */}
          <div className="bg-brown-100 p-6 rounded-lg shadow-md dark:bg-slate-900 dark:border dark:border-gray-600 sm:border sm:border-2 md:border-4 lg:border-8">
            <h3 className="text-2xl font-semibold text-brown mb-3 dark:text-white">98% Satisfaction Rate</h3>
            <p className="text-gray-700 dark:text-gray-300">We are proud of our 98% satisfaction rate, showcasing the quality of service we provide to every customer.</p>
          </div>

          {/* Achievement 4 */}
          <div className="bg-brown-100 p-6 rounded-lg shadow-md dark:bg-slate-900 dark:border dark:border-gray-600 sm:border sm:border-2 md:border-4 lg:border-8">
            <h3 className="text-2xl font-semibold text-brown mb-3 dark:text-white">24/7 Customer Support</h3>
            <p className="text-gray-700 dark:text-gray-300">Our team is always available to assist with booking issues, inquiries, and event management at any time of the day or night.</p>
          </div>
          
          {/* Achievement 5 */}
          <div className="bg-brown-100 p-6 rounded-lg shadow-md dark:bg-slate-900 dark:border dark:border-gray-600 sm:border sm:border-2 md:border-4 lg:border-8">
            <h3 className="text-2xl font-semibold text-brown mb-3 dark:text-white">100% Digital Transition</h3>
            <p className="text-gray-700 dark:text-gray-300">We have fully digitized the booking process, making it easier than ever for users to book and manage their events online.</p>
          </div>
        </Slider>
      </div>
    </div>
  );
}

export default Achievements;
