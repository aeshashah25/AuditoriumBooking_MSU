import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaIndianRupeeSign } from "react-icons/fa6";

const AmenitiesList = () => {
    const [amenities, setAmenities] = useState([]);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [editId, setEditId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAmenities();
    }, []);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000); // Remove message after 3 seconds
            return () => clearTimeout(timer); // Cleanup on component unmount
        }
    }, [message]);

    const fetchAmenities = () => {
        axios
            .get("http://localhost:5002/amenities")
            .then((response) => setAmenities(response.data))
            .catch((error) => console.error("Error fetching amenities:", error));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || price === "") {
            setMessage({ text: "❌ Please enter both Name and Price!", type: "error" });
            return;
        }

        try {
            if (editId) {
                await axios.put(`http://localhost:5002/api/amenities/${editId}`, { name, price });
                setMessage({ text: "✅ Amenity updated successfully!", type: "success" });
            } else {
                await axios.post("http://localhost:5002/api/amenities", { name, price });
                setMessage({ text: "✅ Amenity added successfully!", type: "success" });
            }

            fetchAmenities();
            setName("");
            setPrice("");
            setEditId(null);
        } catch (error) {
            console.error("Error saving amenity:", error);
            setMessage({ text: "❌ Failed to save amenity.", type: "error" });
        }
    };

    const handleEdit = (amenity) => {
        setEditId(amenity.id);
        setName(amenity.name);
        setPrice(amenity.price);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this amenity?")) {
            try {
                await axios.delete(`http://localhost:5002/api/amenities/${id}`);
                setMessage({ text: "✅ Amenity deleted successfully!", type: "success" });
                fetchAmenities();
            } catch (error) {
                console.error("Error deleting amenity:", error);
                setMessage({ text: "❌ Failed to delete amenity.", type: "error" });
            }
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <button
                onClick={() => navigate('/Dashboard')}
                className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-700"
            >
                ⬅ Back
            </button>

            <h2 className="text-2xl font-bold mb-4 text-black">Manage Amenities</h2>

            {/* Success and Error Messages */}
            {message.text && (
                <p className={`mb-4 p-2 text-white rounded-md ${message.type === "success" ? "bg-green-500" : "bg-red-500"} transition-opacity duration-500`}>
                    {message.text}
                </p>
            )}

            <div className="mb-6 p-4 bg-white shadow-md rounded-xl">
                <h3 className="text-lg font-semibold mb-2 ">{editId ? "Edit Amenity" : "Add New Amenity"}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Amenity Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white text-black"
                        required
                    />
                    <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white text-black"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        {editId ? "Update Amenity" : "Add Amenity"}
                    </button>
                </form>
            </div>

            {/* Amenities List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {amenities.length > 0 ? (
                    amenities.map((amenity) => (
                        <div key={amenity.id} className="p-4 bg-white  rounded-xl shadow-md flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-black-100">{amenity.name}</h3>
                                <p className="text-gray-600 flex items-center">
                                    Price: {amenity.price === 0 ? " Free" : <><FaIndianRupeeSign /> {parseInt(amenity.price)}</>}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(amenity)} className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-700">Edit</button>
                                <button onClick={() => handleDelete(amenity.id)} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-700">Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No amenities available.</p>
                )}
            </div>
        </div>
    );
};

export default AmenitiesList;
