import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function BookAuditorium() {
  const { id } = useParams();
  const location = useLocation();
  const auditorium = location.state?.auditorium;

  if (!auditorium) {
    console.error("❌ No auditorium passed in location state!");
    return <p className="text-red-600">Error: No auditorium details found.</p>;
  }

  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    if (auditorium.start_time && auditorium.end_time) {
      generateTimeSlots(auditorium.start_time, auditorium.end_time);
    }
  }, [auditorium, startDate]);

  const generateTimeSlots = (start, end) => {
    const startHour = parseInt(start.substring(0, 2), 10);
    const startMinute = parseInt(start.substring(3, 5), 10);
    const endHour = parseInt(end.substring(0, 2), 10);
    const endMinute = parseInt(end.substring(3, 5), 10);

    let slots = [];
    let hour = startHour;
    let minute = startMinute;

    while (hour < endHour || (hour === endHour && minute < endMinute)) {
      let nextHour = hour;
      let nextMinute = minute + 60;
      if (nextMinute >= 60) {
        nextHour += 1;
        nextMinute -= 60;
      }

      if (nextHour > endHour || (nextHour === endHour && nextMinute > endMinute)) {
        break;
      }

      const formattedTime = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")} - ${nextHour.toString().padStart(2, "0")}:${nextMinute
        .toString()
        .padStart(2, "0")}`;
      slots.push(formattedTime);

      hour = nextHour;
      minute = nextMinute;
    }

    setTimeSlots(slots);
  };

  const handleSlotChange = (slot) => {
    let updatedSlots = [...selectedSlots];
    if (updatedSlots.includes(slot)) {
      updatedSlots = updatedSlots.filter((s) => s !== slot);
    } else {
      updatedSlots.push(slot);
    }
    updatedSlots.sort((a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b));
    setSelectedSlots(updatedSlots);
  };

  useEffect(() => {
    if (!selectedSlots.length || !startDate || !endDate) {
      setTotalPrice(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const totalHours = selectedSlots.length * numDays;
    let amenitiesCost = auditorium.amenities
      .filter((a) => selectedAmenities.includes(a.name))
      .reduce((total, a) => total + a.cost, 0);

    setTotalPrice(totalHours * auditorium.price_per_hour + amenitiesCost);
  }, [selectedSlots, selectedAmenities, startDate, endDate, auditorium]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userId = localStorage.getItem("user_id"); // ✅ Fetch user_id from local storage
  
    if (!userId) {
      alert("User not logged in. Please log in first!");
      return;
    }
  
    if (!eventName || !startDate || !endDate || selectedSlots.length === 0) {
      alert("Please fill all fields!");
      return;
    }
  
    const bookingData = {
      user_id: parseInt(userId), // Ensure it's an integer
      auditorium_id: id,
      event_name: eventName,
      start_date: startDate.toISOString().split("T")[0], 
      end_date: new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Fix End Date Issue
      start_time: selectedSlots[0].split(" - ")[0], 
      end_time: selectedSlots[selectedSlots.length - 1].split(" - ")[1], 
      amenities: selectedAmenities,
      total_price: totalPrice,
    };
  
    console.log("🔵 Booking Data Sent:", bookingData);
  
    try {
      const response = await fetch("http://localhost:5001/book-auditorium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert("✅ Booking successful!");
      } else {
        alert("❌ Error: " + data.message);
      }
    } catch (error) {
      console.error("❌ Error booking auditorium:", error);
      alert("Failed to book auditorium.");
    }
  };
  
  

  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold text-center">Book {auditorium.name}</h2>
      <p className="text-gray-600">⏰ <strong>Time:</strong> {auditorium.start_time} - {auditorium.end_time}</p>
      <p className="text-gray-600">💰 <strong>Price Per Hour:</strong> ₹{auditorium.price_per_hour}</p>
      
      <label className="block text-gray-600">Event Name:</label>
      <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Enter Event Name" />
      
      <div className="flex gap-4">
        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} minDate={new Date()} inline />
        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} minDate={startDate} inline />
      </div>

      <label className="block text-gray-600">Select Time Slots:</label>
      <div className="grid grid-cols-3 gap-2">
        {timeSlots.map((slot, index) => (
          <button
            key={index}
            className={`p-2 border rounded-md ${selectedSlots.includes(slot) ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            onClick={() => handleSlotChange(slot)}
          >
            {slot}
          </button>
        ))}
      </div>

      <label className="block text-gray-600">Select Amenities:</label>
      <div className="flex flex-wrap gap-2">
        {auditorium.amenities.map((amenity, index) => (
          <label key={index} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedAmenities.includes(amenity.name)}
              onChange={() => setSelectedAmenities((prev) => prev.includes(amenity.name) ? prev.filter(a => a !== amenity.name) : [...prev, amenity.name])}
              className="h-5 w-5"
            />
            <span>{amenity.name} (+₹{amenity.cost})</span>
          </label>
        ))}
      </div>

      <div className="text-lg font-bold">Total Price: ₹{totalPrice}</div>
      <button onClick={handleSubmit} className="w-full bg-blue-600 text-white p-3 rounded-md text-lg">Confirm Booking</button>
    </div>
  );
}

export default BookAuditorium;
