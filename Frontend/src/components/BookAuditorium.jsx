// src/components/BookAuditorium.jsx
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';

const BookAuditorium = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Update the current time when the component mounts
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setStartTime(''); // Reset start time when date is changed
    setEndTime('');   // Reset end time when date is changed
    setErrorMessage(''); // Clear error message on date change
  };

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    setErrorMessage(''); // Clear error message when user updates start time

    if (selectedDate && selectedDate.toDateString() === new Date().toDateString() && newStartTime < currentTime) {
      setErrorMessage(`You cannot select a time slot for today before the current time (${currentTime}).`);
    }
  };

  const handleEndTimeChange = (e) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    setErrorMessage(''); // Clear error message when user updates end time

    if (newEndTime <= startTime) {
      setErrorMessage('End time must be after the start time.');
    }
  };

  const handleRequestSubmit = async () => {
    if (!selectedDate || !startTime || !endTime) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
  
    // Fix timezone issue by adjusting for local offset
    const localDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000);
    const formattedDate = localDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  
    try {
      await axios.post("http://localhost:5001/book-auditorium", {
        date: formattedDate,  // Send the correctly adjusted date
        start_time: startTime,
        end_time: endTime,
      });
  
      setIsRequestSent(true);
      setErrorMessage('');
    } catch (error) {
      console.error("Error sending booking request:", error);
      setErrorMessage("Failed to send booking request.");
    }
  };
  

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set today's date to midnight to compare without time
    return date < today; // Disable dates before today
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Book Auditorium</h2>

        <div className="mb-6">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            minDate={new Date()} // Prevent selection of past dates
            tileDisabled={({ date }) => isDateDisabled(date)} // Disable past dates
            className="rounded-md"
          />
        </div>

        {selectedDate && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={handleStartTimeChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min={selectedDate && selectedDate.toDateString() === new Date().toDateString() ? currentTime : '00:00'}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={handleEndTimeChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min={startTime || ''}
                disabled={!startTime}
              />
            </div>
          </>
        )}

        {errorMessage && (
          <div className="mb-4 text-red-600 text-center">
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleRequestSubmit}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Request Booking
        </button>

        {isRequestSent && (
          <div className="mt-4 text-green-600 text-center">
            Your booking request has been sent to the admin!
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAuditorium;
