// src/components/BookingStatus.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingStatus = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get('/api/admin/bookings-status');
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div>
      <h2>Booking Status</h2>
      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            <p>{`Booking for ${booking.date} - Status: ${booking.status}, Payment: ${booking.payment_status}`}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingStatus;
