import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from "react-router-dom"; // Ensure useNavigate is imported


function Auditourim() {
  const navigate = useNavigate();

  const [auditourimData, setAuditourimData] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuditoriums = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/auditoriums');
        setAuditourimData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching auditoriums:', error);
        setError('Failed to load auditoriums.');
        setLoading(false);
      }
    };

    fetchAuditoriums();
  }, []);

  const handleViewMore = () => {
    setShowAll(!showAll);
  };

  const displayData = showAll ? auditourimData : auditourimData.slice(0, 4);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-[#8B4513] text-center">Auditorium Details</h1>

      {loading ? (
        <p className="text-[#8B4513] text-center">Loading auditorium data...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {displayData.map((auditorium) => {
            const imageUrls =
              auditorium.images?.map(
                (image) => `data:${image.mimetype};base64,${image.data}`
              ) || ["/placeholder.png"];

            const amenitiesList = Array.isArray(auditorium.amenities)
              ? auditorium.amenities.map((item) => item.name).join(", ")
              : "No amenities listed";

            return (
              <div key={auditorium.id} className="relative w-full h-96 [perspective:1200px]">
                {/* Flip Card Effect */}
                <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group hover:[transform:rotateY(180deg)]">
                  
                  {/* Front Side */}
                  <div className="absolute w-full h-full bg-white border p-6 rounded-xl shadow-xl flex flex-col justify-between [backface-visibility:hidden]">
                    <h2 className="text-xl font-semibold text-[#8B4513] text-center">
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

                    <p className="mt-4 text-[#8B4513]">
                      <strong>Location:</strong> {auditorium.location}
                    </p>
                    <p className="text-[#8B4513]">
                      <strong>Capacity:</strong> {auditorium.capacity} people
                    </p>
                    <p className="text-[#8B4513]">
                      <strong>Amenities:</strong> {amenitiesList}
                    </p>

                    <div className="mt-4 flex justify-center">
                      <Link
                        to={`/auditorium/${auditorium.id}`}
                        className="bg-[#8B4513] text-white px-6 py-2 rounded-lg hover:bg-[#A0522D] transition duration-300"
                      >
                        More Info
                      </Link>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute w-full h-full bg-[#8B4513] text-white flex flex-col items-center justify-center rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-xl">
                    <h2 className="text-xl font-semibold mb-4 text-center">Book Now</h2>
                    <button
                      className="px-6 py-3 bg-white text-[#8B4513] font-semibold rounded-full shadow-lg 
                                 hover:bg-gray-200 hover:shadow-xl transition duration-300 transform hover:scale-105"
                      onClick={() => navigate(`/auditorium/${auditorium.id}`)}
                    >
                      📅 View More Bookings
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
