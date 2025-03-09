import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaRupeeSign } from "react-icons/fa";
import { FaArrowLeft } from 'react-icons/fa';

const ViewBookingRequests = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [bookingRequests, setBookingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAuditorium, setFilterAuditorium] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPendingBookingRequests();
  }, []);

  const fetchPendingBookingRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/admin/view-pending-booking-requests"
      );
      //console.log("Fetched Booking Requests:", response.data); // Debugging log
      const requests = response.data;

      // Fetch price per hour for each auditorium and update the requests
      const updatedRequests = await Promise.all(
        requests.map(async (request) => {
          const priceResponse = await axios.get(
            `http://localhost:5001/get-auditorium-price/${request.auditorium_id}`
          );
          const pricePerHour = priceResponse.data.pricePerHour;

          // Ensure start_time and end_time are in proper 24-hour format (HH:mm)
          const startTime = request.start_time.split(":");
          const endTime = request.end_time.split(":");

          // Creating Date objects with assumed date (1970-01-01) to calculate duration
          const startDate = new Date(1970, 0, 1, startTime[0], startTime[1]);
          const endDate = new Date(1970, 0, 1, endTime[0], endTime[1]);

          // Calculate duration in hours
          const durationInMilliseconds = endDate - startDate;
          const durationInHours = durationInMilliseconds / 1000 / 60 / 60; // In hours

          if (durationInHours < 0) {
            console.error("Invalid duration: start time is later than end time");
            return { ...request, price: 0, totalPrice: 0 }; // Return default values in case of error
          }

          // Calculate total price
          const totalPrice = pricePerHour * durationInHours;

          return {
            ...request,
            price: pricePerHour,
            totalPrice: totalPrice,
          };
        })
      );

      setBookingRequests(updatedRequests);
    } catch (error) {
      console.error("Error fetching booking requests or prices:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeToAMPM = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const openModal = (request) => {
    //console.log("Selected Request:", request); // Debugging log
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    console.log("Booking ID Sent:", selectedRequest.booking_id); // Debugging log
    console.log("Total Price:", selectedRequest.totalPrice);
    const payload = {
      bookingId: selectedRequest.booking_id, // Ensure correct ID
      amount: selectedRequest.totalPrice,
    };

    try {
      const response = await axios.post("http://localhost:5001/admin/send-payment-request", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data); // Debugging log

      if (response.status === 200) {
        alert(response.data.message || "Payment request sent successfully.");
        fetchPendingBookingRequests();
        closeModal();
      } else {
        console.error("Unexpected response status:", response.status);
        throw new Error(response.data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error sending payment request:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Failed to send payment request.");
    }
  };


  const handleReject = async () => {
    if (!selectedRequest) return;

    const confirmReject = window.confirm("Are you sure you want to reject this booking?");
    if (!confirmReject) return;

    try {
      const response = await axios.post(
        "http://localhost:5001/admin/reject-booking", // Ensure this is correct
        { bookingId: selectedRequest.booking_id }, // Ensure backend expects `booking_id`
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      alert(response.data.message || "Booking request rejected successfully.");
      fetchPendingBookingRequests(); // Refresh data
      closeModal();
    } catch (error) {
      console.error("Error rejecting booking request:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to reject booking request.");
    }
  };


  const filteredRequests = bookingRequests.filter(
    (request) =>
      (request.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.auditorium_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterAuditorium === "" || request.auditorium_name === filterAuditorium)
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/DashBoard')}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-500 transition"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Pending Booking Requests</h2>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row justify-between mb-4 space-y-4 sm:space-y-0">
          <input
            type="text"
            placeholder="Search by username or auditorium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md w-full sm:w-1/3"
          />
          <select
            value={filterAuditorium}
            onChange={(e) => setFilterAuditorium(e.target.value)}
            className="px-4 py-2 border rounded-md w-full sm:w-1/3"
          >
            <option value="">All Auditoriums</option>
            {[...new Set(bookingRequests.map((request) => request.auditorium_name))].map(
              (auditorium) => (
                <option key={auditorium} value={auditorium}>
                  {auditorium}
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
                <th className="border p-2">User</th>
                <th className="border p-2">Auditorium</th>
                <th className="border p-2">Event Name</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Start Time</th>
                <th className="border p-2">End Time</th>
                {/* <th className="border p-2">Price</th>
                <th className="border p-2">Total Price</th> */}
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request, index) => (
                  <tr key={index} className="text-center border-b">
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{request.username}</td>
                    <td className="border p-2">{request.auditorium_name}</td>
                    <td className="border p-2 font-semibold">
                      {request.event_name ? request.event_name.trim() || "N/A" : "N/A"}
                    </td>
                    <td className="border p-2">{formatDate(request.date)}</td>
                    <td className="border p-2">{formatTimeToAMPM(request.start_time)}</td>
                    <td className="border p-2">{formatTimeToAMPM(request.end_time)}</td>
                    {/* <td className="border p-2"><span className="inline-flex items-center">
                      <FaRupeeSign className="mr-1" /> {request.price}
                    </span></td>
                    <td className="border p-2"><span className="inline-flex items-center">
                      <FaRupeeSign className="mr-1" /> {request.totalPrice.toFixed(2)}</span></td> */}
                    <td className="border p-2">
                      <button
                        onClick={() => openModal(request)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mr-2"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center p-4 text-gray-500">
                    No pending booking requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full sm:w-1/3">
            <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
            <div>
              <p><strong>User:</strong> {selectedRequest.username}</p>
              <p><strong>Auditorium:</strong> {selectedRequest.auditorium_name}</p>
              <p><strong>Event Name:</strong> {selectedRequest.event_name}</p>
              <p><strong>Date:</strong> {formatDate(selectedRequest.date)}</p>
              <p><strong>Start Time:</strong> {formatTimeToAMPM(selectedRequest.start_time)}</p>
              <p><strong>End Time:</strong> {formatTimeToAMPM(selectedRequest.end_time)}</p>
              <p><strong>Per Hour Price:</strong> <span className="inline-flex items-center">
                <FaRupeeSign className="mr-1" /> {selectedRequest.price}</span></p>
              <p><strong>Total Cost:</strong> <span className="inline-flex items-center">
                <FaRupeeSign className="mr-1" /> {selectedRequest.totalPrice.toFixed(2)}</span></p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
              >
                Send Payment Request
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 ml-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBookingRequests;
