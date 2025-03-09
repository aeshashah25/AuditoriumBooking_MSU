import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import axios from "axios";

export default function HoveringSlider() {
  const [auditoriums, setAuditoriums] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAuditoriums = async () => {
      try {
        const response = await axios.get("http://localhost:5002/api/auditoriums");
        
        const formattedData = response.data.map(auditorium => ({
          ...auditorium,
          images: Array.isArray(auditorium.images) && auditorium.images.length > 0
            ? auditorium.images.map(img => img?.data ? `data:${img.mimetype};base64,${img.data}` : "/default.jpg")  
            : ["/default.jpg"]  
        }));

       // console.log("Fetched Data:", formattedData);
        setAuditoriums(formattedData);
      } catch (error) {
        console.error("Error fetching auditorium data:", error);
      }
    };

    fetchAuditoriums();
  }, []);  // ✅ Call fetchAuditoriums when component mounts

  useEffect(() => {
    if (auditoriums.length === 0) return;
    const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % auditoriums.length), 3000);
    return () => clearInterval(interval);
  }, [auditoriums]);

  if (auditoriums.length === 0)
    return (
      <div className="flex justify-center items-center h-[300px] sm:h-[400px] md:h-[500px] text-white">
        Loading...
      </div>
    );

  return (
    <div className="relative w-full h-[250px] sm:h-[400px] md:h-[500px] flex items-center justify-center bg-black text-white mt-[60px]">
      {/* Background Image */}
      <motion.img
        key={currentIndex}
        src={auditoriums[currentIndex]?.images[0]}  // ✅ Use only the first image
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover brightness-[1.5] contrast-[1.2] saturate-[1.3]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Navigation Buttons */}
      <button
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/30 hover:bg-white/50 transition-all rounded-full"
        onClick={() => setCurrentIndex((prev) => (prev === 0 ? auditoriums.length - 1 : prev - 1))}
      >
        <FaArrowLeft size={20} className="sm:size-30" />
      </button>
      <button
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/30 hover:bg-white/50 transition-all rounded-full"
        onClick={() => setCurrentIndex((prev) => (prev + 1) % auditoriums.length)}
      >
        <FaArrowRight size={20} className="sm:size-30" />
      </button>

      {/* Content Box */}
      <motion.div
        className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 bg-black/70 p-2 sm:p-4 rounded-lg max-w-xs sm:max-w-md text-right shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg sm:text-xl font-bold">{auditoriums[currentIndex]?.name}</h3>
        <p className="text-xs sm:text-sm mt-1 sm:mt-2 leading-tight">{auditoriums[currentIndex]?.location}</p>
      </motion.div>

      {/* Thumbnails */}
      <div className="absolute bottom-2 sm:bottom-4 flex gap-2 sm:gap-3 overflow-x-auto px-2 sm:px-4">
        {auditoriums.map((item, index) => (
          <motion.img
            key={index}
            src={item.images[0]} // ✅ Use only the first image
            alt={item.name}
            className={`w-8 h-8 sm:w-12 sm:h-12 rounded-md cursor-pointer transition-transform ${
              index === currentIndex ? "border-2 border-white scale-110" : "opacity-50"
            }`}
            onClick={() => setCurrentIndex(index)}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>
    </div>
  );
}
