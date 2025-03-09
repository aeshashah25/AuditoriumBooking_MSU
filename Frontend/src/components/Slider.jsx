import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import image from "../assets/CCMehtaAudt.png";
import image1 from "../assets/DEEp.png";
import image2 from "../assets/PDDUAudt.png";
import image3 from "../assets/CCMehtaAudt.png";
import image4 from "../assets/DEEp.png";
import image5 from "../assets/PDDUAudt.png";

const items = [
  { name: "Auditorium1", des: "A modern auditorium with premium seating and lighting.", background: image },
  { name: "Auditorium2", des: "State-of-the-art sound system with a grand stage.", background: image1 },
  { name: "Auditorium3", des: "Perfect venue for concerts, speeches, and events.", background: image2 },
  { name: "Auditorium4", des: "Elegant design with modern architecture.", background: image3 },
  { name: "Auditorium5", des: "Spacious, comfortable, and well-equipped.", background: image4 },
  { name: "Auditorium6", des: "Designed for seminars and large gatherings.", background: image5 },
];

export default function Slider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden flex items-center justify-center bg-black">
      {/* Background Image with Gradient */}
      <div className="absolute inset-0">
        <motion.img
          key={currentIndex}
          src={items[currentIndex].background}
          alt="Background"
          className="w-full h-full object-cover brightness-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-lg shadow-2xl flex items-center justify-center text-white bg-black/30 p-6 backdrop-blur-lg"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold">{items[currentIndex].name}</h2>
            <p className="mt-3 text-lg">{items[currentIndex].des}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <motion.button
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full shadow-lg transition-all"
        onClick={goToPrevious}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FaArrowLeft size={24} />
      </motion.button>
      <motion.button
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full shadow-lg transition-all"
        onClick={goToNext}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FaArrowRight size={24} />
      </motion.button>

      {/* Thumbnail Images */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
        {items.map((item, index) => (
          <motion.img
            key={index}
            src={item.background}
            alt={`Thumbnail ${index}`}
            className={`w-14 h-14 rounded-lg cursor-pointer border-4 transition-all ${
              index === currentIndex ? "border-blue-500 scale-110" : "border-transparent opacity-70"
            }`}
            onClick={() => setCurrentIndex(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
      </div>
    </div>
  );
}
