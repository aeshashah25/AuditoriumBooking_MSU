import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import BookAuditorium from "./BookAuditorium";

function AuditoriumDetail() {
  const { id } = useParams();
  const [auditorium, setAuditorium] = useState(null);
  const navigate = useNavigate();
  const [flip, setFlip] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-100">
      <div className="w-full max-w-screen-lg md:max-w-2xl lg:max-w-3xl bg-white shadow-lg rounded-lg p-6 relative">
        <AnimatePresence mode="wait">
          {!flip ? (
            <motion.div
              key="front"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: -180, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
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
                onClick={() => navigate(`/book-auditorium/${auditorium.id}`, { state: { auditorium } })}
                className="mt-6 w-full bg-brown hover:bg-brown-light text-white p-3 rounded-md text-lg"
              >
                Book Auditorium
              </button>
            </motion.div>
          ) : (
            // Booking Form Flip Card
            <motion.div
              key="back"
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 180, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <BookAuditorium auditorium={auditorium} setFlip={setFlip} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>


  );
}

export default AuditoriumDetail;