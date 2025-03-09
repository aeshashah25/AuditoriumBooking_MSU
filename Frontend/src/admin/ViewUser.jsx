import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";

function ViewUser() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [expandedUser, setExpandedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("http://localhost:5002/api/users");
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const filteredUsers = users.filter(
        (user) => user.name && user.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleExpand = (userId) => {
        setExpandedUser(expandedUser === userId ? null : userId);
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            {/* Back Button */}
            <button
                className="flex items-center px-4 py-2 mb-4 bg-gray-300 hover:bg-gray-400 rounded-lg transition"
                onClick={() => window.history.back()}
            >
                <FaArrowLeft className="mr-2" /> Back
            </button>

            <h1 className="text-3xl font-bold text-gray-700 mb-6">User Management</h1>

            {/* Search Input */}
            <div className="mb-4 flex justify-center">
                <input
                    type="text"
                    placeholder="🔍 Search by name..."
                    className="p-3 border rounded-lg w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto shadow-lg rounded-lg">
                <table className="w-full bg-white rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-blue-500 text-white text-left">
                            <th className="p-4">Profile</th>
                            <th className="p-4">Username</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <React.Fragment key={user.id}>
                                    {/* Main Row */}
                                    <tr className="border-b hover:bg-gray-100 transition">
                                        <td className="p-4">
                                            <img
                                                src={user.profilePic ? user.profilePic : "https://via.placeholder.com/50"}
                                                alt="Profile"
                                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 shadow-md"
                                            />
                                        </td>
                                        <td className="p-4 text-gray-700 font-semibold">{user.name}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                                onClick={() => toggleExpand(user.id)}
                                            >
                                                {expandedUser === user.id ? "Hide" : "View"}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expandable Row with Animation */}
                                    {expandedUser === user.id && (
                                        <motion.tr 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-gray-50"
                                        >
                                            <td colSpan="3" className="p-4">
                                                <h3 className="text-lg font-semibold mb-2 text-gray-700">User Details</h3>
                                                <p><strong>Name:</strong> {user.name}</p>
                                                <p><strong>Email:</strong> {user.email}</p>
                                                <p><strong>Phone:</strong> {user.phone}</p>
                                            </td>
                                        </motion.tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-4 text-center text-gray-500">No users found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ViewUser;
