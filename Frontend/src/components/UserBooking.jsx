import { useEffect, useState } from "react";
import axios from "axios";

function UserBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchBookings(storedUserId);
    } else {
      console.error("❌ No user ID found in localStorage.");
    }
  }, []);

  const fetchBookings = async (userId) => {
    try {
      const response = await axios.get("http://localhost:5001/get-all-bookings");
      const userBookings = response.data.filter(
        (booking) => String(booking.user_id) === String(userId)
      );
      setBookings(userBookings);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!bookingId || isNaN(bookingId)) {
      console.error("❌ Invalid bookingId:", bookingId);
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:5001/cancel-booking", { 
        bookingId: Number(bookingId) // ✅ Ensure it's a number
      });
  
      // Update UI after cancellation
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, refund_amount: response.data.refund_amount, booking_status: "canceled" } : booking
        )
      );
    } catch (error) {
      console.error("❌ Error canceling booking:", error);
    }
  };
  
  
  const getTotalCost = (booking) => {
    let totalAmount = booking.total_amount || 0;
    let discountPercentage = booking.approved_discount || 0;
    let discountAmount = (totalAmount * discountPercentage) / 100;
    let finalAmount = totalAmount - discountAmount;
  
    if (booking.booking_status === "approved") {
      return (
        <div className="text-sm">
          <p><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</p>
          <p className="text-green-600">
            <strong>Discount ({discountPercentage}%):</strong> -${discountAmount.toFixed(2)}
          </p>
          <p className="font-bold text-blue-600"><strong>Final Price:</strong> ${finalAmount.toFixed(2)}</p>
        </div>
      );
    } 
    else if (booking.booking_status === "rejected") {
      return (
        <div className="text-sm text-red-600">
          <p><strong>Status:</strong> Rejected</p>
          <p><strong>Reason:</strong> {booking.reject_reason || "No reason provided"}</p>
        </div>
      );
    } 
    else if (booking.booking_status === "canceled") {
      return (
        <div className="text-sm text-yellow-600">
          <p><strong>Status:</strong> Canceled</p>
          <p><strong>Refund Amount:</strong> ${booking.refund_amount?.toFixed(2) || "0.00"}</p>
        </div>
      );
    } 
    else {
      return (
        <p className="text-sm"><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</p>
      );
    }
  };
  

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.event_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "" || booking.booking_status === statusFilter)
  );

  const calculateRefund = (firstDate, firstTime) => {
    if (!firstDate || !firstTime) return 0;

    const bookingDateTime = new Date(`${firstDate} ${firstTime}`);
    const now = new Date();
    const diffInHours = (bookingDateTime - now) / (1000 * 60 * 60);

    if (diffInHours < 6) return 0;
    if (diffInHours < 12) return 30;
    if (diffInHours < 24) return 50;
    return 100;
  };

  const extractFirstDateTime = (dates) => {
    let minDate = null;
    let firstTime = null;

    dates.forEach((entry) => {
      let date = entry.date || entry.date_range?.split(" - ")[0];
      let timeSlots = entry.time_slots || [];

      if (date && (!minDate || new Date(date) < new Date(minDate))) {
        minDate = date;
        firstTime = timeSlots.length > 0 ? timeSlots[0].split(" - ")[0] : null;
      }
    });

    return { minDate, firstTime };
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center p-6">
      <div className="container mx-auto w-full max-w-6xl bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Your Bookings
        </h2>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="Search by Event Name..."
            className="border p-2 rounded w-full md:w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border p-2 rounded w-full md:w-1/3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {filteredBookings.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="hidden md:block">
              <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-blue-600 text-white text-left">
                    <th className="border p-3">Event Name</th>
                    <th className="border p-3">Date</th>
                    <th className="border p-3">Total Cost</th>
                    <th className="border p-3">Status</th>
                    <th className="border p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => (
                    <tr
                      key={booking.id}
                      className={`text-gray-700 border ${
                        index % 2 === 0 ? "bg-gray-100" : "bg-white"
                      } hover:bg-blue-100 transition`}
                    >
                      <td className="border p-3 font-medium">
                        {booking.event_name}
                      </td>
                      <td className="border p-3">
                        {booking.dates.map((d) => d.date || d.date_range).join(", ")}
                      </td>
                      <td className="border p-3">{getTotalCost(booking)}</td>
                      <td className="border p-3">{booking.booking_status}</td>
                      <td className="border p-3">
                        <button
                          onClick={() => handleCancel(booking)}
                          disabled={booking.booking_status !== "approved"}
                          className={`w-full py-2 mt-2 rounded-md transition ${
                            booking.booking_status !== "approved"
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-red-500 text-white hover:bg-red-700"
                          }`}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserBooking;
