import React, { useState } from "react";
import { motion } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const BookAuditorium = ({ auditorium, setFlip }) => {
  const [eventName, setEventName] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const isFormValid = eventName && selectedDate && startTime && endTime;

  const handleRequestSubmit = () => {
    if (!isFormValid) return;
    alert("Booking request sent!");
    setFlip(false); // Flip back to auditorium details
  };

  return (
    <motion.div
      key="back"
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      exit={{ rotateY: -180, opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 flex justify-center"
    >
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-6">
        {/* Back Button */}
        <button
          onClick={() => setFlip(false)}
          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
        >
          &#8592; Back to Details
        </button>

        <h2 className="text-3xl font-bold text-center mt-4">
          Book {auditorium.name}
        </h2>

        {/* Event Name */}
        <div className="mt-4">
          <label className="block font-semibold">Event Name</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter Event Name"
          />
        </div>

        {/* Date Selection */}
        <div className="mt-4">
          <label className="block font-semibold">Select Date</label>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            minDate={new Date()} // Prevent past dates
          />
        </div>

        {/* Start & End Time */}
        <div className="mt-4">
          <label className="block font-semibold">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="mt-4">
          <label className="block font-semibold">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        {/* Confirm Booking Button */}
        <button
          onClick={handleRequestSubmit}
          disabled={!isFormValid}
          className={`w-full mt-6 p-2 rounded-md ${
            isFormValid
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Confirm Booking
        </button>
      </div>
    </motion.div>
  );
};

export default BookAuditorium;
