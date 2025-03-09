import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const App = () => {
  const [sticky, setSticky] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${sticky ? "shadow-md bg-white" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-3 flex justify-between items-center">
        
        {/* Logo & Name (Responsive) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img 
            src="logo.png" 
            alt="logo" 
            className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
          />
          <span className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-brown hover:text-brown-light cursor-pointer">
            AuditoriumBookingSystem
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex space-x-4">
          <Link to="/" className="text-black hover:text-brown border-b-2 border-transparent hover:border-brown-dark transition-all duration-300 px-2 py-1">Home</Link>
          <Link to="/contact" className="text-black hover:text-brown border-b-2 border-transparent hover:border-brown-dark transition-all duration-300 px-2 py-1">Contact</Link>
          <Link to="/about" className="text-black hover:text-brown border-b-2 border-transparent hover:border-brown-dark transition-all duration-300 px-2 py-1">About</Link>
        </div>

        {/* Right Section (Login & Mobile Menu Button) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Visible on Large Screens */}
          <Link to="/login" className="hidden lg:block px-4 py-2 bg-brown text-white rounded-md hover:bg-blue-dark transition text-sm sm:text-base">
            Login
          </Link>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-black" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-8 6h8"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`lg:hidden flex flex-col items-center bg-white transition-all duration-300 overflow-hidden ${menuOpen ? "max-h-screen opacity-100 py-4" : "max-h-0 opacity-0"}`}>
        <Link to="/" className="text-lg font-bold text-black hover:text-blue-500 transition duration-300 py-2">Home</Link>
        <Link to="/contact" className="text-lg font-bold text-black hover:text-blue-500 transition duration-300 py-2">Contact</Link>
        <Link to="/about" className="text-lg font-bold text-black hover:text-blue-500 transition duration-300 py-2">About</Link>

        {/* Login Button (Only visible in dropdown on small screens) */}
        <Link to="/login" className="block lg:hidden px-4 py-2 bg-brown text-white rounded-md hover:bg-blue-dark transition mt-2">
          Login
        </Link>
      </div>
    </nav>
  );
};

export default App;
