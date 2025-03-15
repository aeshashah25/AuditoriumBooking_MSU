import React, { useEffect, useState } from "react";

function ViewBookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("http://localhost:5001/get-all-bookings");
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("❌ Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600 mt-5">Loading bookings...</p>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold text-center mb-6">View Booking Requests</h2>
  
      {bookings.length === 0 ? (
        <p className="text-center text-gray-500">No bookings found.</p>
      ) : (
        // ✅ Make the table horizontally scrollable on small screens
        <div className="overflow-x-auto max-w-full">
          <div className="w-full min-w-[900px]">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3">User</th>
                  <th className="border p-3">Auditorium</th>
                  <th className="border p-3">Event Name</th>
                  <th className="border p-3">Dates & Time Slots</th>
                  <th className="border p-3">Amenities</th>
                  <th className="border p-3">Total Cost</th>
                  <th className="border p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="border p-3 text-sm">
                      {booking.user_name} <br />
                      <span className="text-xs text-gray-500">{booking.user_email}</span>
                    </td>
                    <td className="border p-3 text-sm">{booking.auditorium_name}</td>
                    <td className="border p-3 text-sm">{booking.event_name}</td>
                    <td className="border p-3 text-sm">
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
  
                    <td className="border p-3 text-sm">
                      {(() => {
                        if (!booking.amenities || booking.amenities.length === 0) {
                          return "None";
                        }
                        const amenitiesList =
                          typeof booking.amenities === "string"
                            ? booking.amenities.split(",").map((a) => a.trim())
                            : booking.amenities;
                        return amenitiesList.join(", ");
                      })()}
                    </td>
  
                    <td className="border p-3 text-sm">₹{booking.total_amount}</td>
                    <td className="border p-3 text-sm">
                      {booking.booking_status ? (
                        <span
                          className={`px-2 py-1 rounded text-white ${
                            booking.booking_status.toLowerCase() === "approved"
                              ? "bg-green-500"
                              : booking.booking_status.toLowerCase() === "pending"
                              ? "bg-yellow-500"
                              : booking.booking_status.toLowerCase() === "rejected"
                              ? "bg-red-500"
                              : booking.booking_status.toLowerCase() === "cancelled"
                              ? "bg-gray-500"
                              : "bg-blue-500"
                          }`}
                        >
                          {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-500">No status</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
  
  
}

export default ViewBookingRequests;
