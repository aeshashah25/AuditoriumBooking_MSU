import React, { useEffect, useState } from "react";
import axios from "axios";


function ViewBookingStatus() {
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAuditorium, setFilterAuditorium] = useState("");
    const [filterStatus, setFilterStatus] = useState(""); // New filter for status

    useEffect(() => {
        axios.get("http://localhost:5001/admin/view-booking-status")
            .then((response) => {
                setPaymentRequests(response.data);
            })
            .catch((error) => console.error("Error fetching payment requests:", error));
    }, []);

    // Filter payment requests based on searchQuery, auditorium, and status
    const filteredRequests = paymentRequests.filter((request) => {
        return (
            (searchQuery === "" ||
                request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.auditorium_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterAuditorium === "" || request.auditorium_name === filterAuditorium) &&
            (filterStatus === "" || request.booking_status === filterStatus)
        );
    });

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 lg:ml-2">
            <div className="bg-white p-6 shadow-md w-full max-w-6xl mx-auto">
                <div className="pb-6">
                    {/* Heading & Search Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-4">
                        <h2 className="text-3xl font-bold md:text-left text-center">View Booking Status</h2>

                        <input
                            type="text"
                            placeholder="Search by username or auditorium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 border rounded-md w-full md:w-1/3 mt-3 md:mt-0"
                        />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Auditorium Filter */}
                        <select
                            value={filterAuditorium}
                            onChange={(e) => setFilterAuditorium(e.target.value)}
                            className="px-4 py-2 border rounded-md w-full"
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
                            className="px-4 py-2 border rounded-md w-full"
                        >
                            <option value="">All Status</option>
                            {[...new Set(paymentRequests.map((request) => request.booking_status))].map(
                                (status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
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
                                <th className="border p-2">Booking Status</th>
                                <th className="border p-2">Discount %</th>
                                <th className="border p-2">Reject Reason</th>
                                <th className="border p-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-4 text-gray-500">
                                        No booking requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request, index) => {
                                    const isApproved = request.booking_status.toLowerCase() === "approved";
                                    const isRejected = request.booking_status.toLowerCase() === "rejected";
                                    const isConfirmed = request.booking_status.toLowerCase() === "confirmed";

                                    return (
                                        <tr key={index} className="text-center border-b">
                                            <td className="border p-2">{index + 1}</td>
                                            <td className="border p-2">{request.user_name}</td>
                                            <td className="border p-2">{request.auditorium_name}</td>
                                            <td className="border p-2">
                                                {(() => {
                                                    let parsedDates = [];

                                                    try {
                                                        // Parse Dates only if it's a valid JSON string
                                                        parsedDates = JSON.parse(request.Dates);
                                                    } catch (error) {
                                                        console.error("Error parsing Dates field:", error);
                                                        return <p className="text-red-500">Invalid date format</p>;
                                                    }

                                                    if (!Array.isArray(parsedDates) || parsedDates.length === 0) {
                                                        return <p className="text-gray-500">No dates available</p>;
                                                    }

                                                    return parsedDates.map((entry, index) => {
                                                        let dateText = entry.date_range || entry.date || "Unknown Date";

                                                        // Convert date range to "DD Month YYYY to DD Month YYYY"
                                                        if (entry.date_range) {
                                                            const [startDate, endDate] = entry.date_range.split(" - ");
                                                            const formattedStartDate = new Date(startDate).toLocaleDateString("en-GB", {
                                                                day: "2-digit",
                                                                month: "long",
                                                                year: "numeric",
                                                            });
                                                            const formattedEndDate = new Date(endDate).toLocaleDateString("en-GB", {
                                                                day: "2-digit",
                                                                month: "long",
                                                                year: "numeric",
                                                            });
                                                            dateText = `${formattedStartDate} to ${formattedEndDate}`;
                                                        } else {
                                                            dateText = new Date(dateText).toLocaleDateString("en-GB", {
                                                                day: "2-digit",
                                                                month: "long",
                                                                year: "numeric",
                                                            });
                                                        }

                                                        // Handle time slots correctly (single & multiple slots)
                                                        let timeSlotsText = "No time slots";
                                                        if (Array.isArray(entry.time_slots) && entry.time_slots.length > 0) {
                                                            const sortedTimeSlots = entry.time_slots.sort(); // Ensure sorting

                                                            if (sortedTimeSlots.length === 1) {
                                                                timeSlotsText = sortedTimeSlots[0]; // Show single slot as is
                                                            } else {
                                                                const firstSlot = sortedTimeSlots[0].split(" - ")[0]; // Start time
                                                                const lastSlot = sortedTimeSlots[sortedTimeSlots.length - 1].split(" - ")[1]; // End time
                                                                timeSlotsText = `${firstSlot} to ${lastSlot}`;
                                                            }
                                                        }

                                                        return (
                                                            <div key={index} className="text-xs mb-1 p-1 bg-gray-100 rounded">
                                                                <span className="font-semibold">📅 {dateText}</span>
                                                                <br />
                                                                🕒 {timeSlotsText}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </td>


                                            <td className="border p-2 font-semibold">
                                                <span
                                                    className={`px-2 py-1 rounded text-white ${request.booking_status === "approved"
                                                        ? "bg-green-500"
                                                        : request.booking_status === "pending"
                                                            ? "bg-yellow-500"
                                                            : request.booking_status === "rejected"
                                                                ? "bg-red-500"
                                                                : request.booking_status === "confirmed"
                                                                    ? "bg-blue-500"
                                                                    : "bg-gray-500"
                                                        }`}
                                                >
                                                    {request.booking_status.charAt(0).toUpperCase() + request.booking_status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="border p-3 font-semibold">
                                                {isApproved || isConfirmed ? `${request.approved_discount}%` : "—"}
                                            </td>

                                            <td className="border p-3 font-semibold">
                                                {isRejected ? request.reject_reason : "—"}
                                            </td>
                                            <td className="border p-3 font-semibold">
                                                {isApproved || isConfirmed ? `₹${request.discount_amount}` : "—"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
}

export default ViewBookingStatus;
