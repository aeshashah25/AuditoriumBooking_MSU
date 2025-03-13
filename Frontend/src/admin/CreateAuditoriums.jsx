import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const CreateAuditoriums = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "",
    location: "",
    price_per_hour: "",
    start_time: "",
    end_time: "",
  });

  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState({ name: "", cost: "" });
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:5002/api/auditoriums`, { params: { id } })
        .then(response => {
          //console.log("Fetched Data:", response.data); // Debugging line
          if (response.data) {
            setFormData((prev) => ({
              ...prev,
              ...response.data,
              price_per_hour: response.data.price_per_hour || "",
              capacity: response.data.capacity || "",
            }));
            setAmenities(response.data.amenities || []);
            setImages(response.data.images || []);
          }
        })
        .catch(error => console.error("Error fetching auditorium details:", error));
    }
  }, [id]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmenityChange = (e) => {
    setNewAmenity({ ...newAmenity, [e.target.name]: e.target.value });
  };

  const addAmenity = () => {
    if (newAmenity.name && newAmenity.cost) {
      setAmenities([...amenities, newAmenity]);
      setNewAmenity({ name: "", cost: "" });
    }
  };

  const removeAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });
    formDataToSend.append("amenities", JSON.stringify(amenities));
    images.forEach((image) => {
      formDataToSend.append("images", image);
    });

    try {
      if (id) {
        await axios.put(`http://localhost:5002/api/auditoriums/${id}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Auditorium updated successfully!");
      } else {
        await axios.post("http://localhost:5002/api/create-auditorium", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Auditorium added successfully!");
      }
      navigate("/DashBoard/view-auditoriums");
    } catch (error) {
      console.error("Error saving auditorium:", error);
      alert("Failed to save auditorium.");
    }
  };

  return (

    <div className="max-w-5xl mx-auto bg-white p-8 shadow-md rounded-lg mt-6 px-10 ml-4 mr-4">
      <h2 className="text-3xl font-bold  text-black-700 mb-6">
        {id ? "Edit Auditorium" : "Add Auditorium"}
      </h2>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        {/* Left Section - Auditorium Details */}
        <div className="space-y-4">
          <input type="text" name="name" placeholder="Auditorium Name" value={formData.name} onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 " required />

          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />

          <input type="number" name="capacity" placeholder="Capacity" value={formData.capacity} onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />

          <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />

          <input type="number" name="price_per_hour" placeholder="Price Per Hour" value={formData.price_per_hour} onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
        </div>

        {/* Right Section - Time, Amenities, and Image Upload */}
        <div className="space-y-4">
          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
            <input type="time" name="end_time" value={formData.end_time} onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
          </div>

          {/* Add Amenities */}
          <div className="p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg text-gray-700 mb-3">Add Amenities</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="name" value={newAmenity.name} placeholder="Amenity Name" onChange={handleAmenityChange}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-green-400" />
              <input type="number" name="cost" value={newAmenity.cost} placeholder="Amenity Cost" onChange={handleAmenityChange}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-green-400" />
            </div>
            <button type="button" onClick={addAmenity}
              className="w-full bg-green-500 text-white py-2 mt-3 rounded-lg hover:bg-green-600 transition">Add Amenity</button>
          </div>

          {/* Amenities List */}
          {amenities.length > 0 && (
            <ul className="p-4 bg-gray-50 rounded-lg shadow-md">
              {amenities.map((amenity, index) => (
                <li key={index} className="p-2 bg-white border border-gray-300 mb-2 rounded flex justify-between items-center">
                  <span className="text-gray-700">{amenity.name} - ₹{amenity.cost}</span>
                  <button onClick={() => removeAmenity(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">Remove</button>
                </li>
              ))}
            </ul>
          )}

          {/* Image Upload */}
          <input type="file" multiple accept="image/*" onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400 " required={!id} />
        </div>

        {/* Submit Button - Full Width */}
        <div className="col-span-2">
          <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg hover:bg-blue-600 transition">
            {id ? "Update Auditorium" : "Add Auditorium"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAuditoriums;
