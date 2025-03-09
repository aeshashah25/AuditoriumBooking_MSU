import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
      navigate("/ViewAuditoriums");
    } catch (error) {
      console.error("Error saving auditorium:", error);
      alert("Failed to save auditorium.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 shadow-lg rounded-lg relative">
      <button type="button" onClick={() => navigate(-1)} className="absolute top-4 left-4 flex items-center text-gray-700 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>
      <h2 className="text-2xl font-semibold mb-6 text-center">{id ? "Edit Auditorium" : "Add Auditorium"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full p-2 border mb-2" required />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full p-2 border mb-2" required />
        <input type="number" name="capacity" placeholder="Capacity" value={formData.capacity} onChange={handleChange} className="w-full p-2 border mb-2" required />
        <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full p-2 border mb-2" required />
        <input type="number" name="price_per_hour" placeholder="Price Per Hour" value={formData.price_per_hour} onChange={handleChange} className="w-full p-2 border mb-2" required />
        <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full p-2 border mb-2" required />
        <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full p-2 border mb-2" required />
        
        <div className="mb-4">
          <h3 className="font-semibold">Add Amenities</h3>
          <input type="text" name="name" value={newAmenity.name} placeholder="Amenity Name" onChange={handleAmenityChange} className="w-full p-2 border mb-2" />
          <input type="number" name="cost" value={newAmenity.cost} placeholder="Amenity Cost" onChange={handleAmenityChange} className="w-full p-2 border mb-2" />
          <button type="button" onClick={addAmenity} className="w-full bg-green-500 text-white py-2 rounded-lg mb-2">Add Amenity</button>
        </div>

        {amenities.length > 0 && (
          <ul className="mb-4">
            {amenities.map((amenity, index) => (
              <li key={index} className="p-2 bg-gray-100 mb-1 rounded flex justify-between items-center">
                {amenity.name} - ${amenity.cost}
                <button onClick={() => removeAmenity(index)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
              </li>
            ))}
          </ul>
        )}

        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full p-2 border mb-2" required={!id} />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">{id ? "Update" : "Submit"}</button>
      </form>
    </div>
  );
};

export default CreateAuditoriums;
