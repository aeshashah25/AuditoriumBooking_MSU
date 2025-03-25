import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';

function ViewUser() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        axios.get("http://localhost:5002/api/users")
            .then((response) => {
                setUsers(response.data);
            })
            .catch((error) => console.error("Error fetching users:", error));
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === "active" ? "deactive" : "active";

        try {
            await axios.put(`http://localhost:5002/api/users/${userId}/status`, { status: newStatus });
            fetchUsers(); // Refresh users after update
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 lg:ml-3">
            <div className="bg-white p-6 shadow-md w-full max-w-6xl mx-auto overflow-hidden rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold mb-2 sm:mb-0">View Users</h2>
                    <input
                        type="text"
                        placeholder="Search by username"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border rounded-md w-full sm:w-1/3"
                    />
                </div>

                {/* Responsive Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200 text-sm sm:text-base">
                                <th className="border p-2">SR NO</th>
                                <th className="border p-2">Name</th>
                                <th className="border p-2">Email</th>
                                <th className="border p-2">Phone</th>
                                <th className="border p-2">Status</th>
                                <th className="border p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-4 text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr key={user.id} className="text-center border-b text-sm sm:text-base">
                                        <td className="border p-2">{index + 1}</td>
                                        <td className="border p-2">{user.name}</td>
                                        <td className="border p-2 break-all">{user.email}</td>
                                        <td className="border p-2">{user.phone}</td>
                                        <td
                                            className={`border p-2 font-semibold ${user.status === "active" ? "text-green-600" : "text-red-600"
                                                }`}
                                        >
                                            {user.status}
                                        </td>
                                        <td className="border p-2 font-semibold">
                                            <button
                                                onClick={() => handleToggleStatus(user.id, user.status)}
                                                className={`px-3 py-1 rounded-md transition text-xs sm:text-sm ${user.status === "active"
                                                        ? "bg-red-600 text-white hover:bg-red-500"
                                                        : "bg-green-600 text-white hover:bg-green-500"
                                                    }`}
                                            >
                                                {user.status === "active" ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ViewUser;
