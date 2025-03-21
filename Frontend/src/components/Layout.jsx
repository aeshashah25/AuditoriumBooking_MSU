import Header from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

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

const Layout = () => {
  return (
    <div>
      <Header />
      <Outlet />  {/* This will render the active page */}
      {/* Footer Sliding from the Bottom on Scroll */}
      <ScrollAnimation variants={slideBottom}>
        <Footer />
      </ScrollAnimation>
    </div>
  );
};

export default Layout;
