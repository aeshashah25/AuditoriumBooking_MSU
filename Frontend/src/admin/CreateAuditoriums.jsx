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
  const [existingImages, setExistingImages] = useState(formData.images || []);
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (id && formData.images) {
      setExistingImages(formData.images);
    }
  }, [id, formData.images]);

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:5002/api/auditoriums`, { params: { id } })
        .then(response => {
          console.log("Fetched Data:", response.data); // Debugging line

          const formatTime = (isoString) => {
            if (!isoString) return "";
            const date = new Date(isoString);
            return date.toISOString().substring(11, 16);
          };

          if (response.data) {
            setFormData((prev) => ({
              ...prev,
              ...response.data,
              price_per_hour: response.data.price_per_hour || "",
              capacity: response.data.capacity || "",
              start_time: formatTime(response.data.start_time),
              end_time: formatTime(response.data.end_time),
            }));

            setAmenities(response.data.amenities || []);

            // Ensure images are properly extracted (Adjust based on API response)
            if (Array.isArray(response.data.images)) {
              setExistingImages(response.data.images.map(img => img.url || img)); // Fixing URL format
            } else {
              setExistingImages([]);
            }
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
    const selectedFiles = Array.from(e.target.files);
    setImages(selectedFiles);
  };

  // const handleImageChange = (e) => {
  //   setImages([...e.target.files]);
  // };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
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

    <div className="max-w-5xl mx-auto bg-white p-6 sm:p-8 shadow-md mt-6 px-6 sm:px-10 rounded-lg">
      <h2 className="text-2xl sm:text-3xl font-bold text-black-700 mb-6 text-center">
        {id ? "Edit Auditorium" : "Add Auditorium"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Section - Auditorium Details */}
        <div className="space-y-4">
          <input type="text" name="name" placeholder="Auditorium Name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
          <input type="number" name="capacity" placeholder="Capacity" value={formData.capacity} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 mb-1">Opening Time</label>
              <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Closing Time</label>
              <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
            </div>
          </div>

          <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
          <input type="number" name="price_per_hour" placeholder="Price Per Hour" value={formData.price_per_hour} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required />
        </div>

        {/* Right Section - Image Upload and Amenities */}
        <div className="space-y-4">
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-400" required={!id} />

          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4">
              {existingImages.map((img, index) => (
                <div key={index} className="relative">
                  <img src={`data:${img.mimetype};base64,${img.data}`} alt={`Uploaded ${index}`} className="w-24 h-24 rounded-lg shadow-md object-cover" onError={(e) => (e.target.src = "/fallback-image.png")} />
                  <button type="button" onClick={() => handleRemoveExistingImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">✖</button>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg text-gray-700 mb-3">Add Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_auto] gap-5 items-center">
              <input type="text" name="name" value={newAmenity.name} placeholder="Amenity Name" onChange={handleAmenityChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-green-400" />
              <input type="number" name="cost" value={newAmenity.cost} placeholder="Amenity Cost" onChange={handleAmenityChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-green-400" />
              <button type="button" onClick={addAmenity} className="p-2 w-10 h-10 flex items-center justify-center border text-green-500 rounded-full bg-white transition duration-300 hover:bg-green-500 hover:text-white">
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          </div>

          {amenities.length > 0 && (
            <ul className="p-4 bg-gray-50 rounded-lg shadow-md">
              {amenities.map((amenity, index) => (
                <li key={index} className="flex justify-between items-center p-2 border-b last:border-none">
                  <span className="text-gray-700">{amenity.name} - ₹{amenity.cost}</span>
                  <button onClick={() => removeAmenity(index)} className="text-red-500 hover:text-red-700 transition">✖</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit Button */}
        <div className="col-span-1 md:col-span-2">
          <button type="submit" className="w-full bg-gray-600 text-white py-3 rounded-lg text-lg hover:bg-gray-500 transition">
            {id ? "Update Auditorium" : "Add Auditorium"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAuditoriums;
