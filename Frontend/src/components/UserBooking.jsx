import { useEffect, useState } from "react";
import axios from "axios";
import FixedLayout from "../components/FixedLayout";

function UserBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [activeSubTab, setActiveSubTab] = useState("Pending");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchBookings(storedUserId);
    } else {
      console.error("❌ No user ID found in localStorage.");
      setLoading(false);
    }
  }, []);

  const fetchBookings = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5001/user/bookings/${userId}`);
      setBookings(response.data);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await axios.put(`http://localhost:5001/user/bookings/cancel/${bookingId}`);
      alert("✅ Booking cancelled successfully!");

      // Refresh bookings after cancellation
      if (userId) fetchBookings(userId);
    } catch (error) {
      console.error("❌ Error cancelling booking:", error);
      alert("❌ Failed to cancel booking. Try again later.");
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDates = (dates) => (typeof dates === "string" ? JSON.parse(dates) : dates);

  const upcomingBookings = bookings.filter((b) => {
    const dates = parseDates(b.Dates);
    return dates.some((d) => new Date(d.date_range?.split(" - ")[0] || d.date) >= today);
  });

  const historyBookings = bookings.filter((b) => {
    const dates = parseDates(b.Dates);
    return dates.every((d) => new Date(d.date_range?.split(" - ")[1] || d.date) < today);
  });


  const pendingBookings = upcomingBookings.filter((b) => b.booking_status === "Pending");
  const approvedBookings = upcomingBookings.filter((b) => b.booking_status === "approved");
  const rejectedBookings = upcomingBookings.filter((b) => b.booking_status === "rejected");
  const cancelledBookings = upcomingBookings.filter((b) => b.booking_status === "cancelled");

  const getFilteredBookings = () => {
    switch (activeSubTab) {
      case "Pending":
        return pendingBookings;
      case "Approved":
        return approvedBookings;
      case "Rejected":
        return rejectedBookings;
      case "Cancelled":
        return cancelledBookings;
      default:
        return [];
    }
  };

  return (
    <div className="bg-gray-100">
      <FixedLayout>
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mt-6">
          Your Bookings
        </h1>

        <div className="min-h-screen flex flex-col items-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">

          {/* Main Tabs (Upcoming & History) */}
          <div className="w-full max-w-4xl flex justify-center mb-6 border-b border-gray-300">
            {["Upcoming", "History"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-3 text-lg font-semibold transition-all duration-300 ${activeTab === tab
                  ? "text-brown border-b-4 border-brown"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab} Events
              </button>
            ))}
          </div>

          {/* Upcoming Events Section */}
          {activeTab === "Upcoming" && (
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
              <h2 className="text-2xl font-bold text-center mb-4">Upcoming Events</h2>

              {/* Sub-tabs (Pending, Approved, Rejected, Cancelled) */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4">
                {["Pending", "Approved", "Rejected", "Cancelled"].map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => setActiveSubTab(subTab)}
                    className={`px-4 py-2 rounded-lg shadow transition duration-300 
        ${activeSubTab === subTab ? "bg-brown text-white" : "bg-gray-300 text-black"}
        w-full sm:w-auto`}
                  >
                    {subTab}
                  </button>
                ))}
              </div>


              {/* Booking List */}
              {loading ? (
                <p className="text-center text-gray-600">Loading bookings...</p>
              ) : getFilteredBookings().length > 0 ? (
                <ul className="space-y-4">
                  {getFilteredBookings().map((booking) => (
                    <li key={booking.id} className="p-4 bg-gray-50 rounded-lg shadow flex justify-between items-center">
                      <div>
                        <p className="text-lg font-medium">
                          <strong>Auditorium:</strong> {booking.auditorium_name}
                        </p>
                        <p className="text-gray-600">
                          <strong>Event:</strong> {booking.event_name}
                        </p>
                        <p className="text-gray-600 font-medium">
                          <strong>Date & Time:</strong>{" "}
                          {(() => {
                            if (!Array.isArray(booking.Dates) || booking.Dates.length === 0) {
                              return <p className="text-gray-500">No dates available</p>;
                            }

                            const sortedDates = booking.Dates
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
                        </p>

                        <p className="text-gray-600">
                          <strong>Amentities:</strong> {booking.amenities}
                        </p>
                        <p className="text-lg font-medium text-gray-800">
                          <strong>Total Amount:</strong> ₹{booking.total_amount}
                        </p>
                        <p
                          className={`text-lg font-semibold ${booking.booking_status === "Pending"
                            ? "text-yellow-500"
                            : booking.booking_status === "approved"
                              ? "text-green-500"
                              : booking.booking_status === "rejected"
                                ? "text-red-500"
                                : "text-gray-500"
                            }`}
                        >
                          <strong>Status:</strong> {booking.booking_status}
                          {booking.booking_status === "rejected" && (
                            <span className="ml-2 text-sm text-red-400">({booking.reject_reason})</span>
                          )}
                        </p>
                        {/* Show Discount & Final Payable Amount if Approved and Discount > 0 */}
                        {booking.booking_status === "approved" && booking.approved_discount > 0 && (
                          <>
                            <p className="text-gray-700">
                              <strong>Discount Applied:</strong> {booking.approved_discount}%
                            </p>
                            <p className="text-lg font-medium text-green-600">
                              <strong>Final Payable Amount:</strong> ₹{booking.discount_amount}
                            </p>
                          </>
                        )}

                        {/* /* Show Payment Status when Booking is Approved */}
                        {booking.booking_status === "approved" && (
                          <p
                            className={`text-lg font-semibold ${booking.payment_status === "Pending"
                              ? "text-yellow-500"
                              : booking.payment_status === "Completed"
                                ? "text-green-500"
                                : "text-red-500"
                              }`}
                          >
                            <strong>Payment Status:</strong> {booking.payment_status}
                          </p>
                        )}

                      </div>

                      {/* Show Cancel Button for Pending & Approved Bookings */}
                      {["Pending", "approved"].includes(booking.booking_status) && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-600">
                  No {activeSubTab.toLowerCase()} bookings found.
                </p>
              )}
            </div>
          )}

          {/* Booking History Section */}
          {activeTab === "History" && (
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
              <h2 className="text-xl font-bold text-center mb-4">Booking History</h2>
              {loading ? (
                <p className="text-center text-gray-600">Loading bookings...</p>
              ) : historyBookings.length > 0 ? (
                <ul className="space-y-4">
                  {historyBookings.map((booking) => (
                    <li key={booking.id} className="p-4 bg-gray-50 rounded-lg shadow">
                      <p className="text-lg font-medium">
                        <strong>Auditorium:</strong> {booking.auditorium_name}
                      </p>
                      <p className="text-gray-600">
                        <strong>Event:</strong> {booking.event_name}
                      </p>
                      <p className="text-gray-600 font-medium">
                        <strong>Date & Time:</strong>{" "}
                        {(() => {
                          if (!Array.isArray(booking.Dates) || booking.Dates.length === 0) {
                            return <p className="text-gray-500">No dates available</p>;
                          }

                          const sortedDates = booking.Dates
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
                      </p>
                      <p className="text-gray-600">
                        <strong>Amentities:</strong> {booking.amenities}
                      </p>
                      <p className="text-lg font-medium text-gray-800">
                        <strong>Total Amount:</strong> ₹{booking.total_amount}
                      </p>

                      {/* Show Discount & Final Payable Amount if Approved and Discount > 0 */}
                      {booking.booking_status === "Completed" && booking.approved_discount > 0 && (
                        <>
                          <p className="text-gray-700">
                            <strong>Discount Applied:</strong> {booking.approved_discount}%
                          </p>
                          <p className="text-gray-700">
                            <strong>Final Payable Amount:</strong> ₹{booking.discount_amount}
                          </p>
                        </>
                      )}

                      <p className="text-gray-600">
                        <strong>Status:</strong> {booking.event_status}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-600">No past bookings found.</p>
              )}
            </div>
          )}
        </div>
      </FixedLayout>
    </div>
  );
}

export default UserBooking;
