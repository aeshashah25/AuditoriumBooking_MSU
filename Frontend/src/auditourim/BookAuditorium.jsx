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
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({}); // ✅ Store booked slots

  useEffect(() => {
    if (auditorium.start_time && auditorium.end_time) {
      generateTimeSlots(auditorium.start_time, auditorium.end_time);
    }
  }, [auditorium]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const response = await fetch(`http://localhost:5001/booked-slots/${id}`);
        const data = await response.json();
        setBookedSlots(data || {});
      } catch (error) {
        console.error("❌ Error fetching booked slots:", error);
      }
    };

    fetchBookedSlots();
  }, [id]);

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

  const handleDateChange = (date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

    if (selectedDates.includes(localDate)) {
      setSelectedDates(selectedDates.filter((d) => d !== localDate));
      let updatedSlots = { ...selectedSlots };
      delete updatedSlots[localDate];
      setSelectedSlots(updatedSlots);
    } else {
      setSelectedDates([...selectedDates, localDate]);
      setSelectedSlots({ ...selectedSlots, [localDate]: [] });
    }
  };

  const handleSlotChange = (date, slot) => {
    let updatedSlots = { ...selectedSlots };
    if (updatedSlots[date]?.includes(slot)) {
      updatedSlots[date] = updatedSlots[date].filter((s) => s !== slot);
    } else {
      updatedSlots[date] = [...(updatedSlots[date] || []), slot];
    }
    updatedSlots[date].sort((a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b));
    setSelectedSlots(updatedSlots);
  };

  const handleAmenityChange = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity.name) ? prev.filter((a) => a !== amenity.name) : [...prev, amenity.name]
    );
  };

  useEffect(() => {
    if (!selectedDates.length) {
      setTotalPrice(0);
      return;
    }

    let totalHours = 0;
    selectedDates.forEach((date) => {
      totalHours += selectedSlots[date]?.length || 0;
    });

    let amenitiesCost = auditorium.amenities
      .filter((a) => selectedAmenities.includes(a.name))
      .reduce((total, a) => total + a.cost, 0);

    setTotalPrice(totalHours * auditorium.price_per_hour + amenitiesCost);
  }, [selectedSlots, selectedAmenities, selectedDates, auditorium]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("User not logged in. Please log in first!");
      return;
    }

    if (!eventName || selectedDates.length === 0) {
      alert("Please fill all fields!");
      return;
    }

    const bookingData = {
      user_id: parseInt(userId),
      auditorium_id: id,
      event_name: eventName,
      dates: selectedDates.map((date) => ({
        date,
        time_slots: selectedSlots[date] || [],
      })),
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

      <label className="block text-gray-600">Select Dates:</label>
      <DatePicker
        selected={null}
        onChange={handleDateChange}
        minDate={new Date()}
        inline
        highlightDates={selectedDates.map((date) => new Date(date))}
      />

      {selectedDates.map((date) => (
        <div key={date} className="mt-4">
          <h3 className="text-lg font-semibold">{date}</h3>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((slot, index) => (
              <button
                key={index}
                className={`p-2 border rounded-md ${
                  bookedSlots[date]?.includes(slot) ? "bg-gray-400 cursor-not-allowed" : 
                  selectedSlots[date]?.includes(slot) ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
                onClick={() => handleSlotChange(date, slot)}
                disabled={bookedSlots[date]?.includes(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      ))}

      <label className="block text-gray-600">Select Amenities:</label>
      {auditorium.amenities.map((amenity, index) => (
        <div key={index}>
          <input type="checkbox" checked={selectedAmenities.includes(amenity.name)} onChange={() => handleAmenityChange(amenity)} />
          {amenity.name} (+₹{amenity.cost})
        </div>
      ))}
      <h2 className="text-xl font-bold mt-6">Total Cost: ₹{totalPrice}</h2>

      <button onClick={handleSubmit} className="w-full bg-blue-600 text-white p-3 rounded-md text-lg">Confirm Booking</button>
    </div>
  );
}

export default BookAuditorium;
