import React, { useEffect, useState } from "react";
import axios from "axios";

function ViewBookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [discount, setDiscount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionType, setActionType] = useState(""); // "approve" or "reject"
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get("http://localhost:5001/get-all-bookings");
      setBookings(response.data);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setDiscount(booking.approved_discount || "");
    setRejectReason("");
    setActionType("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setDiscount("");
    setRejectReason("");
  };

  const handleAction = async () => {
    if (actionType === "approve" && !discount) {
      alert("Enter discount percentage!");
      return;
    }
    if (actionType === "reject" && !rejectReason) {
      alert("Enter rejection reason!");
      return;
    }

    try {
      await axios.post("http://localhost:5001/update-booking-status", {
        booking_id: selectedBooking.id,
        action: actionType,
        approved_discount: actionType === "approve" ? parseFloat(discount) : null,
        reject_reason: actionType === "reject" ? rejectReason : null,
        user_email: selectedBooking.user_email,
      });

      alert(`Booking ${actionType}d successfully!`);
      closeModal();
      fetchBookings(); // Refresh booking list
    } catch (error) {
      console.error(`❌ Error updating booking status:`, error);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600 mt-5">Loading bookings...</p>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-md mt-6 mx-10">
      <h2 className="text-2xl font-bold text-center mb-6">View Booking Requests</h2>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-500">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto max-w-full">
          <div className="w-full min-w-[900px]">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3">User</th>
                  <th className="border p-3">Auditorium</th>
                  <th className="boredr p-3">Date</th>
                  <th className="border p-3">Event Name</th>
                  <th className="border p-3">Total Cost</th>
                  <th className="border p-3">Status</th>
                  <th className="border p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="border p-3">{booking.user_name} <span className="text-xs text-gray-500">{booking.user_email}</span></td>
                    <td className="border p-3">{booking.auditorium_name}</td>
                    <td className="border p-3">
                      {(() => {
                        if (!Array.isArray(booking.dates) || booking.dates.length === 0) {
                          return <p className="text-gray-500">No dates available</p>;
                        }

                        const sortedDates = booking.dates
                          .map((dateObj) => ({
                            date: dateObj.date || null,
                            date_range: dateObj.date_range || null,
                            time_slots: Array.isArray(dateObj.time_slots) ? dateObj.time_slots.sort() : [],
                          }))
                          .sort((a, b) =>
                            new Date(a.date || a.date_range.split(" - ")[0]) -
                            new Date(b.date || b.date_range.split(" - ")[0])
                          );

                        const formattedDates = [];
                        let tempStart = sortedDates[0]?.date || sortedDates[0]?.date_range;
                        let prevTimeSlots = sortedDates[0]?.time_slots;
                        let currentRange = [tempStart];

                        for (let i = 1; i < sortedDates.length; i++) {
                          const { date, date_range, time_slots } = sortedDates[i];
                          const currentDate = date || date_range;

                          if (JSON.stringify(prevTimeSlots) === JSON.stringify(time_slots)) {
                            currentRange.push(currentDate);
                          } else {
                            formattedDates.push({
                              date_range:
                                currentRange.length > 1
                                  ? `${currentRange[0]} - ${currentRange[currentRange.length - 1]}`
                                  : currentRange[0],
                              time_slots: prevTimeSlots,
                            });

                            currentRange = [currentDate];
                            prevTimeSlots = time_slots;
                          }
                        }

                        formattedDates.push({
                          date_range:
                            currentRange.length > 1
                              ? `${currentRange[0]} - ${currentRange[currentRange.length - 1]}`
                              : currentRange[0],
                          time_slots: prevTimeSlots,
                        });

                        return formattedDates.map((entry, index) => (
                          <div key={index} className="text-xs mb-1 p-1 bg-gray-100 rounded">
                            <span className="font-semibold">
                              📅 {entry.date_range ? entry.date_range : "Date not available"}
                            </span>
                            <br />
                            🕒 {entry.time_slots.length > 0 ? entry.time_slots.join(", ") : "No time slots"}
                          </div>
                        ));
                      })()}

                    </td>
                    <td className="border p-3">{booking.event_name}</td>
                    <td className="border p-3">₹{booking.total_amount}</td>
                    <td className="border p-3">
                      <span
                        className={`px-2 py-1 rounded text-white ${booking.booking_status === "approved"
                          ? "bg-green-500"
                          : booking.booking_status === "pending"
                            ? "bg-yellow-500"
                            : booking.booking_status === "rejected"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                      >
                        {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                      </span>
                    </td>
                    <td className="border p-3 text-center">
                      {booking.booking_status === "Pending" && (
                        <button
                          onClick={() => openModal(booking)}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                        >
                          Manage Booking
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Manage Booking</h2>
            <p>
              <strong>User:</strong> {selectedBooking.user_name} <span className="text-xs text-gray-500">{selectedBooking.user_email}</span>
            </p>
            <p>
              <strong>Event:</strong> {selectedBooking.event_name}
            </p>
            <p>
              <strong>Cost:</strong> ₹{selectedBooking.total_amount}
            </p>
            <p>
              <strong>Amenities:</strong>
              {(() => {
                if (!selectedBooking.amenities || selectedBooking.amenities.length === 0) {
                  return "None";
                }
                const amenitiesList =
                  typeof selectedBooking.amenities === "string"
                    ? selectedBooking.amenities.split(",").map((a) => a.trim())
                    : selectedBooking.amenities;
                return amenitiesList.join(", ");
              })()}
            </p>

            {/* Approve & Reject Buttons */}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setActionType("approve")}
                className={`py-2 px-4 rounded text-white ${actionType === "approve" ? "bg-green-700" : "bg-green-500 hover:bg-green-700"
                  }`}
              >
                Approve
              </button>
              <button
                onClick={() => setActionType("reject")}
                className={`py-2 px-4 rounded text-white ${actionType === "reject" ? "bg-red-700" : "bg-red-500 hover:bg-red-700"
                  }`}
              >
                Reject
              </button>
            </div>

            {/* Discount Input for Approve */}
            {actionType === "approve" && (
              <div className="mt-4">
                <label className="block text-sm font-medium">Discount (%)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded mt-1"
                  placeholder="Enter discount percentage"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            )}

            {/* Rejection Reason Input */}
            {actionType === "reject" && (
              <div className="mt-4">
                <label className="block text-sm font-medium">Rejection Reason</label>
                <textarea
                  className="w-full p-2 border rounded mt-1"
                  placeholder="Enter rejection reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 hover:bg-gray-700 text-white py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`py-2 px-4 rounded text-white ${actionType === "approve" ? "bg-green-500 hover:bg-green-700" : "bg-red-500 hover:bg-red-700"
                  }`}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ViewBookingRequests;
