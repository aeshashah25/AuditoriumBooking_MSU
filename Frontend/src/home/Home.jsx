import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import Feedback from "../components/Feedback";
import About from "../about/About";

// 3D Background Scene
const ThreeScene = () => {
  return (
    <Canvas className="absolute top-0 left-0 w-full h-screen -z-10">
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Stars />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

// Animation Variants
// const fadeIn = {
//   hidden: { opacity: 0, scale: 0.9 },
//   visible: { opacity: 1, scale: 1, transition: { duration: 1 } },
// };

const slideLeft = {
  hidden: { x: -100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 1 } },
};

// const slideRight = {
//   hidden: { x: 100, opacity: 0 },
//   visible: { x: 0, opacity: 1, transition: { duration: 1 } },
// };

const slideTop = {
  hidden: { y: -100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 1 } },
};

const slideBottom = {
  hidden: { y: 100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 1 } },
};

// Scroll Animation Wrapper
const ScrollAnimation = ({ children, variants }) => {
  const { ref, inView } = useInView({ triggerOnce: false, threshold: 0.2 });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={variants}>
      {children}
    </motion.div>
  );
};

function Home() {
  return (
    <div className="relative">
      {/* 3D Background */}
      {/* <ThreeScene /> */}

      {/* Navbar (Always Visible) */}
      <Navbar />

      {/* Banner Sliding from the Left on Scroll */}
      <ScrollAnimation variants={slideLeft}>
        <Banner />
      </ScrollAnimation>

      {/* About Section Sliding from the Right on Scroll */}
        <About />

      {/* Feedback Sliding from the Top on Scroll */}
      <ScrollAnimation variants={slideTop}>
        <Feedback />
      </ScrollAnimation>

      {/* Footer Sliding from the Bottom on Scroll
      <ScrollAnimation variants={slideBottom}>
        <Footer />
      </ScrollAnimation> */}
    </div>
  );
}

export default Home;
