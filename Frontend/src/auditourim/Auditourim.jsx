import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Import Framer Motion

function Auditourim() {
  const navigate = useNavigate();
  const [auditourimData, setAuditourimData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // For filtered results
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // 🔹 Search state

  useEffect(() => {
    const fetchAuditoriums = async () => {
      try {
        const response = await axios.get("http://localhost:5002/api/auditoriums");
        setAuditourimData(response.data);
        setFilteredData(response.data); // Initially show all data
        setLoading(false);
      } catch (error) {
        console.error("Error fetching auditoriums:", error);
        setError("Failed to load auditoriums.");
        setLoading(false);
      }
    };

    fetchAuditoriums();
  }, []);

  // 🔹 Filter Function for Search by Name or Capacity
  useEffect(() => {
    if (!searchQuery) {
      setFilteredData(auditourimData); // If no search query, show all
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const isNumber = !isNaN(query); // Check if input is a number (capacity)

    const filtered = auditourimData.filter((auditorium) => {
      const nameMatch = auditorium.name.toLowerCase().includes(query);
      const capacityMatch = isNumber ? auditorium.capacity >= parseInt(query) : false;
      return nameMatch || capacityMatch;
    });

    setFilteredData(filtered);
  }, [searchQuery, auditourimData]);

  const handleViewMore = () => {
    setShowAll(!showAll);
  };

  //const displayData = showAll ? auditourimData : auditourimData.slice(0, 4);
  const displayData = showAll ? filteredData : filteredData.slice(0, 4);

  return (
    <div className="p-4">

      {/* 🔹 Heading & Search Bar in Same Line */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black-800 text-center sm:text-left">
          Auditorium Details
        </h1>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by Name or Capacity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border rounded-md w-full sm:w-96 md:w-80 lg:w-96 max-w-md 
               focus:outline-none focus:ring-2 focus:ring-[#8B4513] transition duration-300"
        />
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-t-transparent border-[#8B4513] rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-7 justify-center">
          {displayData.map((auditorium, index) => {
            const imageUrls =
              auditorium.images?.map(
                (image) => `data:${image.mimetype};base64,${image.data}`
              ) || ["/placeholder.png"];

            const amenitiesList = Array.isArray(auditorium.amenities)
              ? auditorium.amenities.map((item) => item.name).join(", ")
              : "No amenities listed";

            return (
              <motion.div
                key={auditorium.id}
                className="relative w-full h-96 [perspective:1200px]"
                initial={{ opacity: 0, scale: 0.8, rotateX: -30 }} // Starts smaller and slightly tilted
                whileInView={{ opacity: 1, scale: 1, rotateX: 0 }} // Grows into full size
                viewport={{ once: true, amount: 0.2 }} // Triggers when 20% is in view
                transition={{
                  duration: 1.2,
                  ease: [0.25, 1, 0.5, 1], // Smooth easing
                  delay: index * 0.1, // Stagger effect
                }}
              >

                {/* Flip Card Effect */}
                <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group hover:[transform:rotateY(180deg)]">

                  {/* Front Side */}
                  <div className="absolute w-full h-full bg-white border p-6 rounded-xl shadow-xl flex flex-col justify-between [backface-visibility:hidden]">
                    <h2 className="text-xl font-semibold text-black text-center">
                      {auditorium.name}
                    </h2>

                    {/* Image Section */}
                    <div className="relative flex justify-center">
                      <img
                        src={imageUrls[0]}
                        alt={auditorium.name}
                        className="w-full h-48 object-cover rounded-lg mt-4"
                        onError={(e) => (e.target.src = "/placeholder.png")}
                      />
                    </div>

                    <p className="mt-4">
                      <strong>Location:</strong> {auditorium.location}
                    </p>
                    <p className="">
                      <strong>Capacity:</strong> {auditorium.capacity} people
                    </p>
                    <p className="">
                      <strong>Amenities:</strong> {amenitiesList}
                    </p>
                  </div>


                  {/* Back Side */}
                  <div className="absolute w-full h-full bg-gradient-to-r from-[#6B4226] to-[#8D5A3B] text-white 
                flex flex-col items-center justify-center p-6 rounded-xl [backface-visibility:hidden] 
                [transform:rotateY(180deg)] shadow-xl relative overflow-hidden">
                    {/* Transparent Image in Background */}
                    <div className="absolute inset-0 flex justify-center items-center opacity-30">
                      <img
                        src={imageUrls[0]}
                        alt={auditorium.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => (e.target.src = '/placeholder.png')}
                      />
                    </div>
                    {/* Auditorium Name (Fixed for Responsive Adjustment) */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center uppercase tracking-wide 
                 relative z-10 drop-shadow-lg text-transparent bg-clip-text 
                 bg-gradient-to-r from-white/80 to-gray-300/80 px-4 py-2 
                 rounded-lg max-w-[80%] w-auto mx-auto whitespace-normal">
                      {auditorium.name}
                    </h1>
                    {/* Button Section */}
                    <button
                      className="px-4 py-2 bg-white text-[#87553B] font-semibold rounded-full shadow-md relative z-10 
               hover:bg-gray-200 hover:shadow-lg transition duration-300 transform hover:scale-105 mt-4"
                      onClick={() => navigate(`/auditorium/${auditorium.id}`)}
                    >
                      📅 View More Details
                    </button>
                  </div>
                  {/* End Back Side */}

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* View More / View Less Button */}
      <div className="text-center mt-6">
        <button
          onClick={handleViewMore}
          className="bg-[#8B4513] text-white px-6 py-2 rounded-lg hover:bg-[#A0522D] transition duration-300"
        >
          {showAll ? "View Less" : "View More"}
        </button>
      </div>
    </div>
  );
}

export default Auditourim;
