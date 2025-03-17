import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/feedback")
      .then((res) => res.json())
      .then((data) => {
        //console.log("Fetched feedback data:", data); // Debugging
        setFeedbacks(data);
      })
      .catch((err) => console.error("Error fetching feedback:", err));
  }, []);

  return (
    <div className="py-12 px-6 flex bg-white justify-center ">
      <div className="w-full bg-white max-w-6xl">
        <h2 className="text-4xl bg-white font-extrabold text-center text-brown mb-10">
          What Our Users Say
        </h2>
        <Swiper
          spaceBetween={30}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          loop={true}
          autoplay={{ delay: 4000 }}
          pagination={{ clickable: true }}
          modules={[Pagination, Autoplay]}
          className="pb-4"
        >
          {feedbacks.map((feedback, index) => (
            <SwiperSlide key={index}>
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-lg">
                <div className="flex justify-between items-start">
                  <p className="text-6xl text-gray-300">"</p>
                  <img
                    src={feedback.profilePic} // Now using new API path
                    alt={feedback.username}
                    className="w-16 h-16 rounded-full border-4 border-gray-400"
                  />
                </div>
                <h3 className="mt-5 font-semibold text-xl text-gray-900 text-center">
                  {feedback.username}
                </h3>
                <p className="text-sm text-brown text-justify mt-2">
                  <span className="text-sm text-gray-600">for </span> {feedback.auditoriumName}
                </p>

                <p className="text-gray-700 text-center italic mt-4 leading-relaxed">
                  {feedback.feedbackText}
                </p>
                <p className="text-6xl text-gray-300 text-right">"</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Custom Pagination */}
        <div className="swiper-pagination !bottom-0 mt-6"></div>
      </div>
    </div>
  );
};

export default Feedback;
