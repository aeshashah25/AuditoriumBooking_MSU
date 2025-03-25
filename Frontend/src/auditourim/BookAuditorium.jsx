import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import FixedLayout from "../components/FixedLayout";

function BookAuditorium() {
  const navigate = useNavigate();
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
  const [bookedSlots, setBookedSlots] = useState({});
  const [isDateRangeMode, setIsDateRangeMode] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

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
        setBookedSlots(data || {}); // Save booked slots
      } catch (error) {
        console.error("❌ Error fetching booked slots:", error);
      }
    };

    fetchBookedSlots();
  }, [id]);

  const generateTimeSlots = (start, end) => {
    const startHour = parseInt(start.substring(0, 2), 10);
    const endHour = parseInt(end.substring(0, 2), 10);

    let slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00 - ${(hour + 1).toString().padStart(2, "0")}:00`);
    }
    setTimeSlots(slots);
  };

  const handleDateChange = (update) => {
    if (!update[0] || !update[1]) {
      setDateRange(update);
      return;
    }

    // Convert selected dates to UTC to avoid timezone issues
    const start = new Date(Date.UTC(update[0].getFullYear(), update[0].getMonth(), update[0].getDate()));
    const end = new Date(Date.UTC(update[1].getFullYear(), update[1].getMonth(), update[1].getDate()));

    let range = [];
    let tempDate = new Date(start);

    while (tempDate <= end) {
      range.push(tempDate.toISOString().split("T")[0]); // Ensure correct date format
      tempDate.setUTCDate(tempDate.getUTCDate() + 1); // Use setUTCDate to avoid timezone shift
    }

    setDateRange([start, end]);
    setSelectedDates(range);
  };



  const handleSingleDateChange = (date) => {
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

    if (isDateRangeMode) {
      // If range mode is active, apply the slot change to all dates in the range
      let newSlots = selectedDates.reduce((acc, d) => {
        let slotsForDate = updatedSlots[d] ? [...updatedSlots[d]] : [];

        if (slotsForDate.includes(slot)) {
          // Remove the slot if it was already selected
          acc[d] = slotsForDate.filter((s) => s !== slot);
        } else {
          // Add the slot if it wasn't selected
          acc[d] = [...slotsForDate, slot];
        }

        return acc;
      }, {});

      setSelectedSlots(newSlots);
    } else {
      // Single-date mode: toggle the slot for just this date
      if (updatedSlots[date]?.includes(slot)) {
        updatedSlots[date] = updatedSlots[date].filter((s) => s !== slot);
      } else {
        updatedSlots[date] = [...(updatedSlots[date] || []), slot];
      }

      setSelectedSlots(updatedSlots);
    }
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
      .reduce((total, a) => total + Number(a.cost), 0);

    setTotalPrice(totalHours * Number(auditorium.price_per_hour) + amenitiesCost);
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

    let formattedDates = [];

    if (isDateRangeMode) {
      // Store the date range with the selected time slots
      formattedDates.push({
        date_range: `${selectedDates[0]} - ${selectedDates[selectedDates.length - 1]}`,
        time_slots: selectedSlots[selectedDates[0]] || [],
      });
    } else {
      // Store each date separately with its time slots
      formattedDates = selectedDates.map((date) => ({
        date,
        time_slots: selectedSlots[date] || [],
      }));
    }

    const bookingData = {
      user_id: parseInt(userId),
      auditorium_id: id,
      event_name: eventName,
      dates: formattedDates,
      amenities: selectedAmenities,
      total_price: totalPrice,
    };

    try {
      const response = await fetch("http://localhost:5001/book-auditorium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        alert("✅ Booking Successful!");
        setEventName("");
        setSelectedDates([]);
        setSelectedSlots({});
        setSelectedAmenities([]);
        setTotalPrice(0);
        // ✅ Navigate to MainPage after successful booking
        navigate("/MainPage");
      } else {
        const errorData = await response.json();
        alert(`❌ Booking Failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error("❌ Error submitting booking:", error);
      alert("❌ Error submitting booking. Please try again.");
    }
  };


  return (
    <>
      <div className="bg-gray-100">
        <FixedLayout>
          <div className="p-8 bg-white shadow-lg rounded-lg max-w-4xl mx-auto flex flex-col md:flex-row gap-8 mb-10 border border-gray-100">
            {/* Left Section: Date Selection */}
            <div className="w-full md:w-2/3 bg-gray-50 p-6 rounded-lg shadow-md">
              <label className="block text-gray-700 font-semibold mb-1">Select Booking Type:</label>
              <select
                onChange={(e) => setIsDateRangeMode(e.target.value === 'range')}
                className="w-full p-3 border bg-gray-50 text-gray-800 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              >
                <option value="multiple">Multiple time slots per date</option>
                <option value="range">Same time slots for date range</option>
              </select>

              {/* Dynamic Note Display */}
              {isDateRangeMode ? (
                <p className="bg-yellow-100 p-3 rounded-md text-sm text-gray-700 mb-4">
                  You can select a <strong>range of dates</strong>, and all will have the <strong>same time slots</strong>.
                </p>
              ) : (
                <p className="bg-yellow-100 p-3 rounded-md text-sm text-gray-700 mb-4">
                  You can <strong>choose different time slots</strong> for <strong>each selected date</strong>.
                </p>
              )}

              <label className="block text-gray-700 font-semibold mb-1">Select Dates:</label>
              {isDateRangeMode ? (
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  minDate={new Date(new Date().setDate(new Date().getDate() + 2))}
                  inline
                />
              ) : (
                <DatePicker
                  selected={null}
                  onChange={handleSingleDateChange}
                  minDate={new Date(new Date().setDate(new Date().getDate() + 2))}
                  inline
                />
              )}

              {selectedDates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold">
                    {isDateRangeMode ? `Selected Date Range: ${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]}` : "Selected Dates:"}
                  </h3>

                  {!isDateRangeMode ? (
                    selectedDates.map((date, index) => (
                      <div key={index}>
                        <h4 className="text-md font-semibold mt-2">{date}</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((slot, slotIndex) => (
                            <button
                              key={slotIndex}
                              className={`p-2 border rounded-md 
                      ${selectedSlots[date]?.includes(slot) ? "bg-blue-500 text-white" : "bg-gray-100"} 
                      ${bookedSlots[date]?.includes(slot) ? "bg-gray-300 cursor-not-allowed opacity-50" : ""}`}
                              onClick={() => !bookedSlots[date]?.includes(slot) && handleSlotChange(date, slot)}
                              disabled={bookedSlots[date]?.includes(slot)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>
                      <h4 className="text-md font-semibold mt-2">Time Slots:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot, slotIndex) => {
                          const isBooked = selectedDates.some((date) => bookedSlots[date]?.includes(slot));

                          return (
                            <button
                              key={slotIndex}
                              className={`p-2 border rounded-md 
                      ${selectedSlots[selectedDates[0]]?.includes(slot) ? "bg-blue-500 text-white" : "bg-gray-100"} 
                      ${isBooked ? "bg-gray-300 cursor-not-allowed opacity-50" : ""}`}
                              onClick={() => !isBooked && handleSlotChange(selectedDates[0], slot)}
                              disabled={isBooked}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Section: Booking Details */}
            <div className="w-full md:w-1/3">
              <h2 className="text-3xl text-brown font-bold text-center mb-6">Book {auditorium.name}</h2>

              <label className="block text-gray-700 font-semibold mb-1">Event Name:</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full p-3 border rounded-md bg-gray-50 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                placeholder="Enter Event Name"
              />

              <label className="block text-gray-700 font-semibold mb-1">Select Amenities:</label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {auditorium.amenities.map((amenity, index) => (
                  <label key={index} className="flex items-center space-x-2 bg-white p-3 rounded-md border">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity.name)}
                      onChange={() => handleAmenityChange(amenity)}
                      className="mr-2"
                    />
                    <span>{amenity.name} (+₹{amenity.cost})</span>
                  </label>
                ))}
              </div>

              <h2 className="text-xl font-bold mt-6 text-gray-800">Total Cost: ₹{totalPrice}</h2>

              <button
                onClick={handleSubmit}
                className="w-full bg-brown text-white p-3 rounded-md text-lg mt-4 hover:bg-brown-light transition duration-300"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </FixedLayout>
      </div>
    </>
  );
}

export default BookAuditorium;