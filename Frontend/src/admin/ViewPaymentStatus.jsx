import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {FaArrowLeft} from 'react-icons/fa';

function ViewPaymentStatus() {
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAuditorium, setFilterAuditorium] = useState("");
    const [filterStatus, setFilterStatus] = useState(""); // New filter for status
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("http://localhost:5001/admin/view-payment-status")
            .then((response) => {
                setPaymentRequests(response.data);
            })
            .catch((error) => console.error("Error fetching payment requests:", error));
    }, []);

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    }

    function formatTime(timeString) {
        if (!timeString) return "N/A";
        const [hours, minutes] = timeString.split(":");
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    }

    // Filter payment requests based on searchQuery, auditorium, and status
    const filteredRequests = paymentRequests.filter((request) => {
        return (
            (searchQuery === "" ||
                request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.auditorium_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterAuditorium === "" || request.auditorium_name === filterAuditorium) &&
            (filterStatus === "" || request.payment_status === filterStatus)
        );
    });

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-6 shadow-md w-full max-w-6xl mx-auto lg:ml-2">
                <h2 className="text-2xl font-bold mb-4 text-center">View Payment Status</h2>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-between mb-4 space-y-4 sm:space-y-0">
                    <input
                        type="text"
                        placeholder="Search by username or auditorium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border rounded-md w-full sm:w-1/3"
                    />
                    
                    {/* Auditorium Filter */}
                    <select
                        value={filterAuditorium}
                        onChange={(e) => setFilterAuditorium(e.target.value)}
                        className="px-4 py-2 border rounded-md w-full sm:w-1/3"
                    >
                        <option value="">All Auditoriums</option>
                        {[...new Set(paymentRequests.map((request) => request.auditorium_name))].map(
                            (auditorium) => (
                                <option key={auditorium} value={auditorium}>
                                    {auditorium}
                                </option>
                            )
                        )}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border rounded-md w-full sm:w-1/3"
                    >
                        <option value="">All Status</option>
                        {[...new Set(paymentRequests.map((request) => request.payment_status))].map(
                            (status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">SR NO</th>
                                <th className="border p-2">User Name</th>
                                <th className="border p-2">Auditorium</th>
                                <th className="border p-2">Date</th>
                                <th className="border p-2">Start Time</th>
                                <th className="border p-2">End Time</th>
                                {/* <th className="border p-2">Booking Status</th> */}
                                <th className="border p-2">Payment Status</th>
                                <th className="border p-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-4 text-gray-500">
                                        No payment requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request, index) => (
                                    <tr key={index} className="text-center border-b">
                                        <td className="border p-2">{index + 1}</td>
                                        <td className="border p-2">{request.user_name}</td>
                                        <td className="border p-2">{request.auditorium_name}</td>
                                        <td className="border p-2">{formatDate(request.date)}</td>
                                        <td className="border p-2">{formatTime(request.start_time)}</td>
                                        <td className="border p-2">{formatTime(request.end_time)}</td>
                                        {/* <td className="border p-2 font-semibold">{request.booking_status}</td> */}
                                        <td className="border p-2 font-semibold">{request.payment_status}</td>
                                        <td className="border p-2 font-semibold">₹{request.total_amount}</td>
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

export default ViewPaymentStatus;
