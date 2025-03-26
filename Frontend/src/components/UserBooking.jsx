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

  const upcomingBookings = bookings.filter((b) =>
    JSON.parse(b.Dates).some((d) => new Date(d.date_range?.split(" - ")[0] || d.date) >= today)
  );

  const historyBookings = bookings.filter((b) =>
    JSON.parse(b.Dates).every((d) => new Date(d.date_range?.split(" - ")[1] || d.date) < today)
  );

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
                        <p className="text-gray-600">
                          <strong>Date:</strong> {booking.Dates}
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
                        <strong>Status:</strong> {booking.booking_status}
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
