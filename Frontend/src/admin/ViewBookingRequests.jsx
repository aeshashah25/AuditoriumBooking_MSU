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
        event_name: selectedBooking.event_name,
        discount_amount: selectedBooking.discount_amount,
        dates: JSON.stringify(selectedBooking.dates),
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
    <div className="p-6 bg-white shadow-md mt-6 mx-4 sm:mx-6 md:mx-10 overflow-hidden">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
        View Booking Requests
      </h2>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-500">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] md:min-w-[900px] border-collapse border border-gray-200 text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2 sm:p-3">SR NO</th>
                <th className="border p-2 sm:p-3">User</th>
                <th className="border p-2 sm:p-3">Auditorium</th>
                <th className="border p-2 sm:p-3">Date</th>
                <th className="border p-2 sm:p-3">Event Name</th>
                <th className="border p-2 sm:p-3">Cost</th>
                <th className="border p-2 sm:p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2 sm:p-3">
                    {booking.user_name}
                    <br />
                    <span className="text-xs text-gray-500 break-words">
                      {booking.user_email}
                    </span>
                  </td>
                  <td className="border p-2 sm:p-3">{booking.auditorium_name}</td>
                  <td className="border p-2 sm:p-3">
                    {(() => {
                      if (!Array.isArray(booking.dates) || booking.dates.length === 0) {
                        return <p className="text-gray-500">No dates available</p>;
                      }

                      const sortedDates = booking.dates
                        .map((dateObj) => ({
                          date: dateObj.date || null,
                          date_range: dateObj.date_range || null,
                          time_slots: Array.isArray(dateObj.time_slots)
                            ? dateObj.time_slots.sort()
                            : [],
                        }))
                        .sort(
                          (a, b) =>
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
                            date_range: formatDateRange(currentRange),
                            time_slots: formatTimeSlots(prevTimeSlots),
                          });

                          currentRange = [currentDate];
                          prevTimeSlots = time_slots;
                        }
                      }

                      formattedDates.push({
                        date_range: formatDateRange(currentRange),
                        time_slots: formatTimeSlots(prevTimeSlots),
                      });

                      return formattedDates.map((entry, index) => (
                        <div key={index} className="text-xs mb-1 p-1 bg-gray-100 rounded">
                          <span className="font-semibold">📅 {entry.date_range}</span>
                          <br />
                          🕒 {entry.time_slots}
                        </div>
                      ));

                      function formatDateRange(dateStr) {
                        if (Array.isArray(dateStr)) {
                          const startDate = formatDate(dateStr[0].split(" - ")[0]);
                          const endDate = formatDate(dateStr[dateStr.length - 1].split(" - ").pop());
                          return startDate === endDate ? startDate : `${startDate} to ${endDate}`;
                        }
                        return formatDate(dateStr.split(" - ")[0]) + " to " + formatDate(dateStr.split(" - ")[1]);
                      }

                      function formatDate(dateStr) {
                        if (!dateStr) return "Invalid Date";
                        const date = new Date(dateStr.trim());
                        return isNaN(date.getTime())
                          ? "Invalid Date"
                          : date.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          });
                      }

                      function formatTimeSlots(timeSlots) {
                        if (timeSlots.length === 0) return "No time slots";
                        if (timeSlots.length === 1) return timeSlots[0];

                        let groupedSlots = [];
                        let startSlot = timeSlots[0].split(" - ")[0];
                        let endSlot = timeSlots[0].split(" - ")[1];

                        for (let i = 1; i < timeSlots.length; i++) {
                          const [currentStart, currentEnd] = timeSlots[i].split(" - ");

                          if (currentStart === endSlot) {
                            endSlot = currentEnd;
                          } else {
                            groupedSlots.push(`${startSlot} - ${endSlot}`);
                            startSlot = currentStart;
                            endSlot = currentEnd;
                          }
                        }
                        groupedSlots.push(`${startSlot} - ${endSlot}`);

                        return groupedSlots.join(", ");
                      }
                    })()}

                  </td>
                  <td className="border p-2 sm:p-3">{booking.event_name}</td>
                  <td className="border p-2 sm:p-3">₹{booking.total_amount}</td>
                  <td className="border p-2 sm:p-3 text-center">
                    {booking.booking_status === "Pending" && (
                      <button
                        onClick={() => openModal(booking)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 sm:py-2 rounded"
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
      )}

      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-4 sm:p-6 rounded-md shadow-lg w-full max-w-md sm:max-w-lg">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-center">
              Manage Booking
            </h2>
            <p>
              <strong>User:</strong> {selectedBooking.user_name} ({" "}
              <span className="text-xs text-gray-500">{selectedBooking.user_email}</span>)
            </p>
            <p>
              <strong>Auditorium:</strong> {selectedBooking.auditorium_name}
            </p>
            <p>
              <strong>Event:</strong> {selectedBooking.event_name}
            </p>
            <p>
              <strong>Cost:</strong> ₹{selectedBooking.total_amount}
            </p>

            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setActionType("approve")}
                disabled={actionType === "reject"}
                className={`py-1 px-3 rounded text-white ${actionType === "approve" ? "bg-green-700" : "bg-green-500 hover:bg-green-700"
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                Approve
              </button>
              <button
                onClick={() => setActionType("reject")}
                disabled={actionType === "approve"}
                className={`py-1 px-3 rounded text-white ${actionType === "reject" ? "bg-red-700" : "bg-red-500 hover:bg-red-700"
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                Reject
              </button>
            </div>

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

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={closeModal}
                className="bg-gray-500 hover:bg-gray-700 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className="py-2 px-4 rounded text-white bg-blue-500 hover:bg-blue-700"
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
