import { FaBuilding, FaUsers, FaCalendarCheck } from "react-icons/fa";
import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import axios from "axios";
import aboutImage from "../assets/about_image.jpg";

const FadeInWhenVisible = ({ children, direction = "up", delay = 0 }) => {
  const controls = useAnimation();
  const { ref, inView } = useInView({ triggerOnce: false, threshold: 0.2 });

  useEffect(() => {
    controls.start(
      inView
        ? { opacity: 1, y: 0, x: 0 }
        : direction === "up"
        ? { opacity: 0, y: 50 }
        : direction === "down"
        ? { opacity: 0, y: -50 }
        : direction === "left"
        ? { opacity: 0, x: -50 }
        : { opacity: 0, x: 50 }
    );
  }, [controls, inView, direction]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={controls}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
};

const AboutUs = () => {
  const [counters, setCounters] = useState({
    totalUsers: 0,
    totalAuditoriums: 0,
    totalBookings: 0,
    totalEvents: 0,
  });

  const { ref: aboutRef, inView: aboutInView } = useInView({
    triggerOnce: false,
    threshold: 0.2,
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

          {/* Left Side - Animated Image */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="relative w-full lg:w-1/2 flex justify-center"
          >
            <div className="relative w-[350px] max-w-[450px] h-[500px] overflow-hidden rounded-tl-[15%] rounded-br-[15%] shadow-2xl">
              <img
                src={aboutImage}
                alt="Auditorium"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div
            ref={aboutRef}
            initial={{ opacity: 0, x: 100 }} // Start faded out and slightly to the right
            animate={aboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }} // Fade in when in view
            transition={{ duration: 1 }}
            className="w-full lg:w-1/2 text-center lg:text-left"
          >
            <h2 className="text-4xl font-extrabold text-brown">About Us</h2>

            <p className="mt-4 text-lg text-gray-700 leading-relaxed">
              Welcome to <span className="font-semibold text-brown-dark">AuditourimBookingSystem</span>.
              This platform is designed to simplify the process of booking auditoriums for events, seminars, and gatherings.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              Inspired by the legacy of The Maharaja Sayajirao's grandson, Sir Pratapsinghrao Gaekwad,
              who founded the Maharaja Sayajirao University and established the Sir Sayajirao Diamond Jubilee and Memorial Trust,
              our mission is to continue serving the community with excellence.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              Our goal is to provide a seamless and user-friendly experience for managing auditorium bookings while ensuring
              efficiency and accessibility for all users.
            </p>
          </motion.div>

        </div>

        {/* Counter Section */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 w-full">
          {[
            { icon: <FaBuilding size={40} className="text-brown" />, count: counters.totalAuditoriums, label: "Auditoriums" },
            { icon: <FaCalendarCheck size={40} className="text-green-600" />, count: counters.totalEvents, label: "Events Hosted" },
            { icon: <FaUsers size={40} className="text-purple-600" />, count: counters.totalUsers, label: "Community Members" },
            { icon: <FaCalendarCheck size={40} className="text-orange-600" />, count: counters.totalBookings, label: "Total Bookings" },
          ].map((item, index) => (
            <FadeInWhenVisible key={index} direction="up" delay={0.1 * index}>
              <div className="flex flex-col items-center p-6 sm:p-8 bg-white border rounded-xl shadow-lg hover:shadow-xl transition duration-300">
                {item.icon}
                <p className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900">{item.count}</p>
                <p className="mt-2 text-sm sm:text-lg font-semibold text-gray-700">{item.label}</p>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
