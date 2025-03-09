import React, { useState, useEffect } from "react";
import axios from "axios";

const UserBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserBookings();
    }
  }, [userId]);

  const fetchUserBookings = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/user/bookings/${userId}`);
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  const formatTime = (timeString) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const today = new Date();
  const upcomingBookings = bookings.filter(booking => new Date(booking.date) >= today);
  const historyBookings = bookings.filter(booking => new Date(booking.date) < today);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex justify-start mb-4">
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-brown text-white rounded-lg shadow-md hover:bg-brown-dark">Back</button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl grid grid-cols-2 gap-6">
        {/* History Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-center">History</h2>
          {historyBookings.length > 0 ? (
            <ul className="space-y-4">
              {historyBookings.map((booking, index) => (
                <li key={booking.id || index} className="p-4 bg-gray-50 rounded-lg shadow">
                  <p className="text-lg font-medium">
                    <strong>Auditorium:</strong> {booking.auditorium_name}
                  </p>
                  <p className="text-gray-600">
                    <strong>Date:</strong> {formatDate(booking.date)} | <strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                  <p className="text-gray-600">
                    <strong>Status:</strong>
                    <span className={`font-semibold ${booking.status === "Approved" ? "text-green-600" : booking.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>
                      {booking.status}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-600">No past bookings found.</p>
          )}
        </div>

        {/* Upcoming Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-center">Upcoming Events</h2>
          {upcomingBookings.length > 0 ? (
            <ul className="space-y-4">
              {upcomingBookings.map((booking, index) => (
                <li key={booking.id || index} className="p-4 bg-gray-50 rounded-lg shadow">
                  <p className="text-lg font-medium">
                    <strong>Auditorium:</strong> {booking.auditorium_name}
                  </p>
                  <p className="text-gray-600">
                    <strong>Date:</strong> {formatDate(booking.date)} | <strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                  <p className="text-gray-600">
                    <strong>Status:</strong>
                    <span className={`font-semibold ${booking.status === "Approved" ? "text-green-600" : booking.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>
                      {booking.status}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-600">No upcoming events found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBooking;
