import { FaBuilding, FaUsers, FaCalendarCheck } from "react-icons/fa";
import { useState, useEffect } from "react";
import axios from "axios";
import aboutImage from "../assets/about_image.jpg"; // Ensure the correct path

const AboutUs = () => {
  const [counters, setCounters] = useState({
    totalUsers: 0,
    totalAuditoriums: 0,
    totalBookings: 0,
    totalEvents: 0,
  });

  useEffect(() => {
    axios
      .get("http://localhost:5002/api/dashboard-counters")
      .then((response) => {
        setCounters(response.data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);
  return (
    <div className="bg-gray-100 py-16 px-6 flex justify-center">
      <div className="container mx-auto flex flex-col gap-12">

        {/* Image & Content Section */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12">

          {/* Left Side - Image */}
          <div className="relative w-full lg:w-1/2 flex justify-center">
            <div className="relative w-[350px] max-w-[450px] h-[500px] overflow-hidden rounded-tl-[15%] rounded-br-[15%] shadow-2xl">
              <img
                src={aboutImage}
                alt="Auditorium"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-4xl font-extrabold text-brown">About Us</h2>

            <p className="mt-4 text-lg text-gray-700 leading-relaxed">
              Welcome to <span className="font-semibold text-brown-dark">AuditourimBookingSystem</span>.
              This platform is designed to simplify the process of booking auditoriums for events, seminars, and gatherings.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              Inspired by the legacy of The Maharaja Sayajirao's grandson, Sir Pratapsinghrao Gaekwad,
              who founded the Maharaja Sayajirao University and established the Sir Sayajirao Diamond Jubilee and Memorial Trust,
              our mission is to continue serving the community with excellence. The trust caters to the educational and
              organizational needs of the people of the former state of Baroda, and we aim to extend this legacy through our digital platform.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              Our goal is to provide a seamless and user-friendly experience for managing auditorium bookings while ensuring
              efficiency and accessibility for all users.
            </p>
          </div>
        </div>

        {/* Counter Section */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full">
          {/* Counter 1 - Auditoriums */}
          <div className="flex flex-col items-center p-8 bg-white border rounded-xl shadow-lg hover:shadow-xl transition duration-300">
            <FaBuilding size={50} className="text-brown" />
            <p className="mt-4 text-4xl font-extrabold text-gray-900">{counters.totalAuditoriums}</p>
            <p className="mt-2 text-lg font-semibold text-gray-700">Auditoriums</p>
          </div>

          {/* Counter 2 - Events Hosted */}
          <div className="flex flex-col items-center p-8 bg-white border rounded-xl shadow-lg hover:shadow-xl transition duration-300">
            <FaCalendarCheck size={50} className="text-green-600" />
            <p className="mt-4 text-4xl font-extrabold text-gray-900">{counters.totalEvents}</p>
            <p className="mt-2 text-lg font-semibold text-gray-700">Events Hosted</p>
          </div>

          {/* Counter 3 - Users Registered */}
          <div className="flex flex-col items-center p-8 bg-white border rounded-xl shadow-lg hover:shadow-xl transition duration-300">
            <FaUsers size={50} className="text-purple-600" />
            <p className="mt-4 text-4xl font-extrabold text-gray-900">{counters.totalUsers}</p>
            <p className="mt-2 text-lg font-semibold text-gray-700">Users Registered</p>
          </div>

          {/* Counter 4 - Total Bookings */}
          <div className="flex flex-col items-center p-8 bg-white border rounded-xl shadow-lg hover:shadow-xl transition duration-300">
            <FaCalendarCheck size={50} className="text-orange-600" />
            <p className="mt-4 text-4xl font-extrabold text-gray-900">{counters.totalBookings}</p>
            <p className="mt-2 text-lg font-semibold text-gray-700">Total Bookings</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;