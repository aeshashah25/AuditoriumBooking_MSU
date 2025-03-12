import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import BookAuditorium from "./BookAuditorium";

function AuditoriumDetail() {
  const { id } = useParams();
  const [auditorium, setAuditorium] = useState(null);
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5002/api/auditoriums?id=${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          data.images = Array.isArray(data.images)
            ? data.images.map((img) => `data:${img.mimetype};base64,${img.data}`)
            : [];
          data.start_time = formatTime(data.start_time);
          data.end_time = formatTime(data.end_time);
          setAuditorium(data);
        }
      })
      .catch((error) => console.error("Error fetching auditorium:", error));
  }, [id]);

  const formatTime = (timeString) => {
    if (!timeString) return "Not Available";
    return timeString.substring(11, 16);
  };

  if (!auditorium) return <p>Loading details...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-100 relative">
      {/* Auditorium Details */}
      <div className="w-full max-w-screen-lg md:max-w-2xl lg:max-w-3xl bg-white shadow-lg rounded-lg p-6 relative transition-all">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-brown hover:bg-brown-light text-white p-2 rounded-md"
        >
          Back
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mt-10">{auditorium.name}</h1>

        {/* Image Slider */}
        <div className="mt-6">
          {auditorium.images.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={10}
              slidesPerView={1}
              className="rounded-lg overflow-hidden"
            >
              {auditorium.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={image}
                    alt={`Auditorium-${index + 1}`}
                    className="w-full h-[320px] md:h-[400px] lg:h-[500px] object-cover rounded-lg"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img
              src="default-image.jpg"
              alt="Default Auditorium"
              className="w-full h-[320px] md:h-[400px] lg:h-[500px] object-cover rounded-lg"
            />
          )}
        </div>

        {/* Details Section */}
        <div className="mt-6 space-y-4 text-gray-700 text-lg">
          <p><strong>📍 Location:</strong> {auditorium.location}</p>
          <p><strong>👥 Capacity:</strong> {auditorium.capacity} people</p>
          <p><strong>⏰ Start Time:</strong> {auditorium.start_time}</p>
          <p><strong>⏳ End Time:</strong> {auditorium.end_time}</p>
          <p><strong>📝 Description:</strong> {auditorium.description || "No description available."}</p>
          <p><strong>💰 Price per Hour:</strong> ₹{auditorium.price_per_hour}</p>
        </div>

        {/* Book Button */}
        <button
          onClick={() => {
            navigate(`/book-auditorium/${auditorium.id}`, { state: { auditorium } });
            setShowBooking(true);
          }}
          className="mt-6 w-full bg-brown hover:bg-brown-light text-white p-3 rounded-md text-lg"
        >
          Book Auditorium
        </button>

      </div>

      {/* Sliding Book Auditorium Component */}
      {showBooking && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 right-0 h-full w-full md:w-[50%] lg:w-[40%] bg-white shadow-xl p-6 overflow-y-auto z-50"
        >
          <button
            onClick={() => setShowBooking(false)}
            className="absolute top-4 right-4 bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-md"
          >
            Close
          </button>
          <BookAuditorium auditorium={auditorium} setFlip={setShowBooking} />
        </motion.div>
      )}
    </div>
  );
}

export default AuditoriumDetail;
