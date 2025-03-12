import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrashAlt, FaUndo } from "react-icons/fa";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ArrowLeft } from "lucide-react";


function ViewAuditoriums() {
  const [auditoriums, setAuditoriums] = useState([]);
  const [maintenanceAuditoriums, setMaintenanceAuditoriums] = useState([]);
  const [selectedAuditorium, setSelectedAuditorium] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5002/api/auditoriums")
      .then((response) => response.json())
      .then((data) => setAuditoriums(data))
      .catch((error) => console.error("Error fetching auditoriums:", error));

  
  }, []);

  const handleViewDetails = (auditorium) => {
    setSelectedAuditorium(auditorium);
  };
  const handleToggleMaintenance = (id, isUnderMaintenance) => {
    const confirmationMessage = isUnderMaintenance
      ? "Are you sure you want to restore this auditorium?"
      : "Are you sure you want to move this auditorium to maintenance?";
  
    if (!window.confirm(confirmationMessage)) return;
  
    fetch(`http://localhost:5002/api/auditoriums/${id}/toggle-maintenance`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message || "Operation successful");
  
        setAuditoriums((prev) => {
          if (isUnderMaintenance) {
            // Restore: Move from maintenance list to main list
            const restoredAuditorium = maintenanceAuditoriums.find(a => a.id === id);
            return [...prev, restoredAuditorium];
          } else {
            // Move to maintenance: Remove from main list
            return prev.filter((auditorium) => auditorium.id !== id);
          }
        });
  
        setMaintenanceAuditoriums((prev) => {
          if (isUnderMaintenance) {
            // Remove from maintenance list after restore
            return prev.filter((auditorium) => auditorium.id !== id);
          } else {
            // Add to maintenance list after marking it
            const movedAuditorium = auditoriums.find(a => a.id === id);
            return [...prev, movedAuditorium];
          }
        });
      })
      .catch((error) => console.error("Error toggling maintenance:", error));
  };
  
  const handleEdit = (id) => {
    navigate(`/CreateAuditorium/${id}`);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white text-black">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left px-6 pt-6">Admin - View Auditoriums</h1>
      <button type="button" onClick={() => navigate(-1)} className="absolute top-4 left-4 flex items-center text-gray-700 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>
      <div className="flex-1 overflow-auto px-6">
        <div className="overflow-x-auto bg-gray-100 shadow-lg rounded-lg p-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-3 text-left">Name</th>
                <th className="border border-gray-300 p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditoriums.map((auditorium) => (
                <tr key={auditorium.id} className="border border-gray-300 hover:bg-gray-100 transition-all">
                  <td className="p-3 text-sm md:text-base font-medium">{auditorium.name}</td>
                  <td className="p-3 flex space-x-4 text-lg">
                    <FaEye className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleViewDetails(auditorium)} />
                    <FaEdit className="text-yellow-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleEdit(auditorium.id)} />
                    <FaTrashAlt className="text-red-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleToggleMaintenance(auditorium.id, false)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {selectedAuditorium && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-lg relative">
              <button
                onClick={() => setSelectedAuditorium(null)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
              >
                ✖
              </button>
              <Slider dots infinite speed={500} slidesToShow={1} slidesToScroll={1} className="rounded-lg">
                {selectedAuditorium.images.map((image, index) => (
                  <div key={index} className="flex justify-center">
                    <img
                      src={`data:${image.mimetype};base64,${image.data}`}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </Slider>
              <h2 className="text-xl font-bold mt-4">{selectedAuditorium.name}</h2>
              <p>{selectedAuditorium.description}</p>
              <p><strong>Location:</strong> {selectedAuditorium.location}</p>
              <p><strong>Capacity:</strong> {selectedAuditorium.capacity}</p>
              <p><strong>Price per Hour:</strong> ₹{selectedAuditorium.price_per_hour}</p>
              <p><strong>Amenities:</strong></p>
              <ul className="list-disc list-inside">
                {selectedAuditorium.amenities.map((item, index) => (
                  <li key={index}>{item.name} - ₹{item.cost}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
  
        <h2 className="text-xl font-semibold mt-8 text-center md:text-left">Under Maintenance</h2>
        <div className="overflow-x-auto bg-gray-100 shadow-lg rounded-lg p-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-3 text-left">Name</th>
                <th className="border border-gray-300 p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceAuditoriums.map((auditorium) => (
                <tr key={auditorium.id} className="border border-gray-300 hover:bg-gray-100 transition-all">
                  <td className="p-3 text-sm md:text-base font-medium">{auditorium.name}</td>
                  <td className="p-3">
                    <FaUndo className="text-green-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleToggleMaintenance(auditorium.id, true)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  

}

export default ViewAuditoriums;