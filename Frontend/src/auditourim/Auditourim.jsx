import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa"; // Import sorting icons

function Auditourim() {
  const navigate = useNavigate();
  const [auditourimData, setAuditourimData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState(null); // Sorting state

  useEffect(() => {
    const fetchAuditoriums = async () => {
      try {
        const response = await axios.get("http://localhost:5002/api/auditoriums");
        setAuditourimData(response.data);
        setFilteredData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching auditoriums:", error);
        setError("Failed to load auditoriums.");
        setLoading(false);
      }
    };

    fetchAuditoriums();
  }, []);

  // 🔹 Search Filter
  useEffect(() => {
    let result = auditourimData;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const isNumber = !isNaN(query);

      result = auditourimData.filter((auditorium) => {
        const nameMatch = auditorium.name.toLowerCase().includes(query);
        const capacityMatch = isNumber ? auditorium.capacity >= parseInt(query) : false;
        return nameMatch || capacityMatch;
      });
    }

    // 🔹 Apply Sorting
    if (sortOrder !== null) {
      result = [...result].sort((a, b) =>
        sortOrder === "asc" ? a.price_per_hour - b.price_per_hour : b.price_per_hour - a.price_per_hour
      );
    }

    setFilteredData(result);
  }, [searchQuery, auditourimData, sortOrder]);

  const handleViewMore = () => {
    setShowAll(!showAll);
  };

  // 🔹 Toggle Sorting Order
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const displayData = showAll ? filteredData : filteredData.slice(0, 4);

  return (
    <div className="p-4">

      {/* 🔹 Heading, Search, and Sort in a Row */}
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

        {/* 🔹 Sort Button */}
        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 px-4 py-2 border rounded-md bg-white shadow-md 
                 hover:bg-gray-100 transition duration-300"
        >
          Sort by Price{" "}
          {sortOrder === "asc" ? <FaSortUp /> : sortOrder === "desc" ? <FaSortDown /> : <FaSort />}
        </button>
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
                initial={{ opacity: 0, scale: 0.8, rotateX: -30 }}
                whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 1.2,
                  ease: [0.25, 1, 0.5, 1],
                  delay: index * 0.1,
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
                    <p>
                      <strong>Capacity:</strong> {auditorium.capacity} people
                    </p>
                    <p>
                      <strong>Price:</strong> ₹{auditorium.price_per_hour}
                    </p>
                    <p>
                      <strong>Amenities:</strong> {amenitiesList}
                    </p>
                  </div>

                  {/* Back Side */}
                  <div className="absolute w-full h-full bg-gradient-to-r from-[#6B4226] to-[#8D5A3B] text-white 
                flex flex-col items-center justify-center p-6 rounded-xl [backface-visibility:hidden] 
                [transform:rotateY(180deg)] shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 flex justify-center items-center opacity-30">
                      <img
                        src={imageUrls[0]}
                        alt={auditorium.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => (e.target.src = '/placeholder.png')}
                      />
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center uppercase tracking-wide relative z-10 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-gray-300/80 px-4 py-2 rounded-lg max-w-[80%] w-auto mx-auto whitespace-normal">
                      {auditorium.name}
                    </h1>
                    <button
                      className="px-4 py-2 bg-white text-[#87553B] font-semibold rounded-full shadow-md relative z-10 
               hover:bg-gray-200 hover:shadow-lg transition duration-300 transform hover:scale-105 mt-4"
                      onClick={() => navigate(`/auditorium/${auditorium.id}`)}
                    >
                      📅 View More Details
                    </button>
                  </div>
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
