import sql from 'mssql';
import express from 'express';
import cors from 'cors';
import nodemailer from "nodemailer";
import moment from "moment";
import cron from"node-cron";

const router = express.Router();
const app = express();

app.use(express.json());
app.use(cors());


// ✅ Define database connection ONCE
const poolPromise = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,  // Use encryption for security (optional)
    trustServerCertificate: true,  // Adjust based on your setup
  }
}).connect();

app.get("/booked-slots/:auditoriumId", async (req, res) => {
  try {
    const { auditoriumId } = req.params;
    const pool = await poolPromise;

    // ✅ Fetch JSON column from MSSQL
    const query = `
      SELECT Dates
      FROM bookings 
      WHERE AuditoriumID = @auditoriumId 
      AND booking_status IN ('pending', 'approved')
    `;

    const result = await pool.request()
      .input('auditoriumId', sql.Int, auditoriumId)
      .query(query);

    // ✅ Return empty object if no bookings found
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(200).json({});
    }

    let bookedSlots = {};

    // ✅ Process each booking entry
    result.recordset.forEach((booking) => {
      if (!booking.Dates) return; // ✅ Skip if Dates is NULL

      try {
        let parsedDates = JSON.parse(booking.Dates); // ✅ Parse JSON from Dates column

        if (!Array.isArray(parsedDates)) {
          throw new Error("Invalid JSON structure");
        }

        parsedDates.forEach((entry) => {
          if (!entry.date || !Array.isArray(entry.time_slots)) {
            console.warn("⚠️ Invalid entry in Dates column:", entry);
            return;
          }

          if (!bookedSlots[entry.date]) {
            bookedSlots[entry.date] = [];
          }
          bookedSlots[entry.date].push(...entry.time_slots);
        });

      } catch (err) {
        console.error("❌ JSON Parsing Error:", err);
      }
    });

    res.status(200).json(bookedSlots); // ✅ Send final response OUTSIDE loop

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to format time from SQL (Date string)
function formatTimeFromSQL(timeString) {
  if (timeString instanceof Date || !isNaN(Date.parse(timeString))) {
    const localTime = new Date(timeString);
    const hours = localTime.getUTCHours();
    const minutes = localTime.getUTCMinutes();
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  }
  return 'N/A'; // Return 'N/A' if the time is not valid
}

// Route for booking the auditorium
app.post('/book-auditorium', async (req, res) => {
  try {
    console.log("🔵 Received Booking Data:", req.body); // Debugging Step 1

    const { user_id, auditorium_id, event_name, dates, amenities, total_price } = req.body;

    if (!user_id || !auditorium_id || !event_name || !dates || dates.length === 0 || total_price === undefined) {
      return res.status(400).json({ message: '❌ Missing required fields!' });
    }

    const pool = await poolPromise;

    // Convert the dates array into a JSON string for storage
    const datesJson = JSON.stringify(dates);

    await pool.request()
      .input('UserId', sql.Int, user_id)
      .input('AuditoriumId', sql.Int, auditorium_id)
      .input('EventName', sql.VarChar, event_name)
      .input('Dates', sql.NVarChar, datesJson) // Store dates as JSON
      .input('Amenities', sql.NVarChar, amenities ? amenities.join(", ") : "")
      .input('TotalAmount', sql.Decimal(10, 2), total_price)
      .execute('InsertBooking'); // Call stored procedure

    res.status(200).json({ message: '✅ Booking Created Successfully' });
  } catch (err) {
    console.error("❌ Error inserting booking:", err); // Debugging Step 2
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ Get booked slots for an auditorium
app.get('/booked-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('AuditoriumId', sql.Int, id)
      .query(`
        SELECT dates, booking_status 
        FROM bookings 
        WHERE auditorium_id = @AuditoriumId 
          AND booking_status IN ('pending', 'approved') 
      `);

    let bookedSlots = {};

    result.recordset.forEach((booking) => {
      const bookingDates = JSON.parse(booking.dates);
      bookingDates.forEach(({ date, time_slots }) => {
        if (!bookedSlots[date]) {
          bookedSlots[date] = new Set();
        }
        time_slots.forEach(slot => bookedSlots[date].add(slot));
      });
    });

    // Convert sets back to arrays for JSON response
    Object.keys(bookedSlots).forEach(date => {
      bookedSlots[date] = Array.from(bookedSlots[date]);
    });

    res.status(200).json(bookedSlots);
  } catch (err) {
    console.error("❌ Error fetching booked slots:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// ✅ Get all bookings using the stored procedure
app.get('/get-all-bookings', async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().execute('GetAllBookings');

    const bookings = result.recordset.map(booking => ({
      ...booking,
      dates: JSON.parse(booking.dates) // Convert stored JSON dates back to array
    }));

    res.status(200).json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// API to Approve or Reject Booking
app.post("/update-booking-status", async (req, res) => {
  //console.log("Received Request Body:", req.body); // Debugging line
  const { booking_id, action, approved_discount, reject_reason, user_email, event_name, dates } = req.body;

  if (!booking_id || !action || !user_email) {
    return res.status(400).json({ error: "Booking ID and action ,  and user email are required" });
  }

  try {
    const pool = await poolPromise;
    let request = pool.request();

    request.input("BookingID", sql.Int, booking_id);
    request.input("Action", sql.VarChar(10), action);

    if (action === "approve") {
      if (approved_discount === undefined) {
        return res.status(400).json({ error: "Approved discount is required for approval" });
      }
      request.input("ApprovedDiscount", sql.Decimal(10, 2), approved_discount);
    } else {
      request.input("ApprovedDiscount", sql.Decimal(10, 2), null);
    }

    if (action === "reject") {
      if (!reject_reason) {
        return res.status(400).json({ error: "Reject reason is required for rejection" });
      }
      request.input("RejectReason", sql.Text, reject_reason);
    } else {
      request.input("RejectReason", sql.Text, null);
    }

    let result = await request.execute("UpdateBookingStatus");

    // ✅ Fetch the updated discount amount from the database
    let discountQuery = await pool
      .request()
      .input("BookingID", sql.Int, booking_id)
      .query("SELECT discount_amount,total_amount FROM bookings WHERE id = @BookingID");

    let updatedDiscountAmount = discountQuery.recordset[0]?.discount_amount || 0; // Ensure value is not null
    let beforeDiscountAmount = discountQuery.recordset[0]?.total_amount || 0;
    // ✅ Send Email Notification with the updated amount
    if (user_email) {
      await sendEmailNotification(user_email, action, event_name, JSON.parse(dates), reject_reason, approved_discount, updatedDiscountAmount, beforeDiscountAmount);
    }

    res.json(result.recordset[0]); // Return the message from the stored procedure
  } catch (error) {
    console.error("❌ Database Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/cancel-booking", async (req, res) => {
  const { bookingId } = req.body;

  try {
    const pool = await poolPromise;
    
    // Fetch booking details
    const result = await pool.request()
      .input("bookingId", sql.Int, bookingId)
      .query(`
        SELECT booking_status, event_status, total_amount, discount_amount, Dates 
        FROM bookings 
        WHERE id = @bookingId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = result.recordset[0];
    const { booking_status, event_status, total_amount, discount_amount, Dates } = booking;

    console.log("📌 Booking Data:", booking);

    let dates;
    try {
      dates = JSON.parse(Dates);
    } catch (error) {
      console.error("❌ Error parsing JSON:", error);
      return res.status(500).json({ error: "Invalid booking time slots" });
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "Invalid booking time slots" });
    }

    // ✅ Step 1: Convert date ranges into individual dates
    let expandedDates = [];

    dates.forEach((entry) => {
      if (entry.date_range) {
        const [startDate, endDate] = entry.date_range.split(" - ");
        let currentDate = moment(startDate, "YYYY-MM-DD");

        while (currentDate.isSameOrBefore(moment(endDate, "YYYY-MM-DD"))) {
          expandedDates.push({
            date: currentDate.format("YYYY-MM-DD"),
            time_slots: entry.time_slots,
          });
          currentDate.add(1, "day");
        }
      } else {
        expandedDates.push(entry);
      }
    });

    console.log("✅ Expanded Dates:", expandedDates);

    // ✅ Step 2: Remove empty time slot dates
    expandedDates = expandedDates.filter((entry) => entry.time_slots.length > 0);

    if (expandedDates.length === 0) {
      return res.status(400).json({ error: "No valid time slots found for cancellation" });
    }

    // ✅ Step 3: Find earliest and latest time slots
    let earliestTime = null;
    let latestTime = null;

    expandedDates.forEach((entry) => {
      entry.time_slots.forEach((slot) => {
        const [startTime, endTime] = slot.split(" - ");
        const slotStartDateTime = moment(`${entry.date} ${startTime}`, "YYYY-MM-DD HH:mm");
        const slotEndDateTime = moment(`${entry.date} ${endTime}`, "YYYY-MM-DD HH:mm");

        if (!earliestTime || slotStartDateTime.isBefore(earliestTime)) {
          earliestTime = slotStartDateTime;
        }
        if (!latestTime || slotEndDateTime.isAfter(latestTime)) {
          latestTime = slotEndDateTime;
        }
      });
    });

    if (!earliestTime || !latestTime) {
      return res.status(400).json({ error: "Invalid booking data (missing valid time slots)" });
    }

    console.log("✅ Earliest Booking Time:", earliestTime.format("YYYY-MM-DD HH:mm"));
    console.log("✅ Latest Booking Time:", latestTime.format("YYYY-MM-DD HH:mm"));

    const now = moment();
    console.log("🕒 Current Time:", now.format("YYYY-MM-DD HH:mm"));

    // ✅ Step 4: If the latest booking time has passed, mark as complete (No refund)
    if (now.isAfter(latestTime)) {
      console.log("🚫 Event has already ended, marking as complete. No refund!");

      await pool.request()
        .input("bookingId", sql.Int, bookingId)
        .input("refundAmount", sql.Decimal(10, 2), 0)
        .query(`
          UPDATE bookings 
          SET booking_status = 'complete', event_status = 'complete', refund_amount = @refundAmount 
          WHERE id = @bookingId
        `);

      return res.json({ message: "Event is complete, no refund!", refundAmount: 0 });
    }

    // ✅ Step 5: Calculate refund percentage based on earliest time slot
    let refundPercentage = 0;
    const hoursDiff = earliestTime.diff(now, "hours");

    console.log("🕒 Hours Until Booking:", hoursDiff);

    if (booking_status === "rejected") {
      refundPercentage = 100; // Full refund for rejected bookings
    } else {
      if (hoursDiff < 6) {
        refundPercentage = 0;
      } else if (hoursDiff < 12) {
        refundPercentage = 30;
      } else if (hoursDiff < 24) {
        refundPercentage = 50;
      } else {
        refundPercentage = 100;
      }
    }

    // ✅ Step 6: Calculate refund amount
    let refundAmount = 0;
    if (refundPercentage > 0) {
      let amountToDeductFrom = discount_amount ? discount_amount : total_amount;
      refundAmount = (refundPercentage / 100) * amountToDeductFrom;
    }

    console.log(`💰 Refund Percentage:${refundPercentage}%`);
    console.log(`💰 Refund Amount: ${refundAmount}`);

    // ✅ Step 7: Update database
    await pool.request()
      .input("bookingId", sql.Int, bookingId)
      .input("refundAmount", sql.Decimal(10, 2), refundAmount)
      .query(`
        UPDATE bookings 
        SET booking_status = 'cancelled', refund_amount = @refundAmount 
        WHERE id = @bookingId
      `);

    res.json({ message: "Booking cancelled successfully", refundAmount });
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Function to merge time slots and handle both 'date' and 'date_range'
function mergeTimeSlots(dates) {
  return dates.map(entry => {
    let dateFormatted;

    if (entry.date) {
      // Format single date as "21 March 2025"
      dateFormatted = new Date(entry.date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "long", year: "numeric"
      });
    } else if (entry.date_range) {
      // Format date range as "21 March 2025 - 22 March 2025"
      let [startDate, endDate] = entry.date_range.split(" - ");
      let formattedStartDate = new Date(startDate).toLocaleDateString("en-GB", {
        day: "2-digit", month: "long", year: "numeric"
      });
      let formattedEndDate = new Date(endDate).toLocaleDateString("en-GB", {
        day: "2-digit", month: "long", year: "numeric"
      });
      dateFormatted = `<strong>${formattedStartDate} - ${formattedEndDate}</strong>`;
    } else {
      return "Invalid date format";
    }

    // Merge time slots into a single range
    let timeSlots = entry.time_slots;
    if (timeSlots.length === 0) return `${dateFormatted} (No time slots)`;

    let startTime = timeSlots[0].split(" - ")[0]; // First slot start time
    let endTime = timeSlots[timeSlots.length - 1].split(" - ")[1]; // Last slot end time

    return `<strong>${dateFormatted}</strong> from <strong>${startTime} to ${endTime}</strong>`;
  }).join("<br>");
}

// Function to Send Email Notification
async function sendEmailNotification(email, action, eventName, dates, rejectReason, discount, discount_amount, total_amount) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ✅ Merge time slots before formatting
  let formattedDates = mergeTimeSlots(dates);

  let subject, message;

  if (action === "approve") {
    subject = "Booking Approved 🎉";

    //console.log(`📩 Payable Amount: ${discount_amount}`);
    //console.log(`📩 Total Amount before Discount: ${total_amount}`);

    message = `
      <p>Your booking request for <strong>${eventName}</strong> on:<br><br>${formattedDates}<br></p>`;

    if (discount === 100) {
      message += `
          <p>🎉 <strong>Your booking is confirmed!</strong> No payment is required.</p>
          <p>Enjoy your event at our auditorium! If you have any questions, feel free to contact us.</p>`;
    } else if (discount > 0) {
      message += `
          <p>has been approved! 🎉</p>
          <p>🎊 <strong>You have received a ${discount}% discount!</strong></p>
          <p><strong>Original Price:</strong> ₹<s>${total_amount}</s></p>
          <p><strong>Final Payable Amount:</strong> ₹<strong>${discount_amount}</strong></p>
          <p>Please complete the payment using the QR code provided within <strong>24 hours</strong> to confirm your booking.</p>
          <p><strong>Failure to pay within the time limit will result in automatic cancellation.</strong></p>`;
    } else {
      message += `
          <p>has been approved! 🎉</p>
          <p>The total amount payable is ₹<strong>${discount_amount}</strong>.</p>
          <p><strong>Please complete the payment using the QR code</strong> within <strong>24 hours</strong> to confirm your booking.</p>
          <p><strong>Failure to pay within the time limit will result in automatic cancellation.</strong></p>`;
    }
  } else {
    subject = "Booking Rejected ❌";
    message = `
      <p> <strong>Unfortunately, your booking request for ${eventName}</strong> on:</p>
      <p><strong>${formattedDates}</strong></p>
      <p><strong>has been rejected</strong> due to: <strong>${rejectReason}</strong>.</p>
      <p>If you have any questions, you can reply to this message for further clarification.</p>
      <p>We apologize for any inconvenience caused.</p>`;
  }

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    //console.log("✅ Email Sent Successfully!");
  } catch (error) {
    console.error("❌ Error Sending Email:", error);
  }
}




//admin View Payment Status
app.get('/admin/view-payment-status', async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT 
        b.id AS booking_id, 
        ud.name AS user_name, 
        a.name AS auditorium_name, 
        FORMAT(b.date, 'yyyy-MM-dd') AS date,
        b.start_time,
        b.end_time,
        b.payment_status,
        b.total_amount
      FROM Bookings b
      INNER JOIN UsersDetails ud ON b.UserId = ud.id
      INNER JOIN Auditoriums a ON b.AuditoriumId = a.id;
    `;

    const result = await pool.request().query(query);

    // Format the response data
    const formattedResults = result.recordset.map(request => ({
      ...request,
      start_time: formatTimeFromSQL(request.start_time),  // Format start time
      end_time: formatTimeFromSQL(request.end_time),  // Format end time
    }));

    res.json(formattedResults); // ✅ Send formatted JSON response

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//admin View Booking Status
app.get('/admin/view-booking-status', async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
                SELECT 
              b.id AS booking_id, 
              ud.name AS user_name, 
              a.name AS auditorium_name, 
              b.event_name,
              b.Dates,
              b.booking_status,
              b.discount_amount,
              b.approved_discount,
              b.reject_reason
          FROM Bookings b
          INNER JOIN UsersDetails ud ON b.UserId = ud.id
          INNER JOIN Auditoriums a ON b.AuditoriumId = a.id
          WHERE b.booking_status <> 'Pending';
    `;

    const result = await pool.request().query(query);

    res.json(result.recordset); // ✅ Send formatted JSON response

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//admin View Event Status
app.get('/admin/view-event-status', async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT 
        b.id AS booking_id, 
        ud.name AS user_name, 
        a.name AS auditorium_name, 
        FORMAT(b.date, 'yyyy-MM-dd') AS date,
        b.start_time,
        b.end_time,
        b.event_status,
        b.total_amount
      FROM Bookings b
      INNER JOIN UsersDetails ud ON b.UserId = ud.id
      INNER JOIN Auditoriums a ON b.AuditoriumId = a.id;
    `;

    const result = await pool.request().query(query);

    // Format the response data
    const formattedResults = result.recordset.map(request => ({
      ...request,
      start_time: formatTimeFromSQL(request.start_time),  // Format start time
      end_time: formatTimeFromSQL(request.end_time),  // Format end time
    }));

    res.json(formattedResults); // ✅ Send formatted JSON response

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch bookings for a specific user
app.get("/user/bookings/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const pool = await poolPromise; // Use the existing database connection
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(
        `SELECT b.id, b.date, b.start_time, b.end_time, b.booking_status, 
                a.name AS auditorium_name
         FROM bookings b
         JOIN auditoriums a ON b.AuditoriumID = a.id
         WHERE b.UserID = @userId
         ORDER BY b.date DESC`
      );

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/admin/completed-events', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Update the status of past bookings before fetching completed events
    // await pool.request().query(`
    //   UPDATE bookings 
    //   SET status = 'Completed' 
    //   WHERE status = 'Pending' 
    //   AND date < CAST(GETDATE() AS DATE)
    //   OR (date = CAST(GETDATE() AS DATE) AND end_time < CAST(GETDATE() AS TIME));
    // `);

    // Fetch completed bookings
    const result = await pool.request().query(`
      SELECT b.id, b.date, b.start_time, b.end_time, b.event_name, b.status, 
             a.name AS auditorium_name, u.name AS booked_by
      FROM bookings b
      JOIN auditoriums a ON b.AuditoriumID = a.id
      JOIN UsersDetails u ON b.UserID = u.id
      WHERE b.status = 'Complete'
      ORDER BY b.date DESC;
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching completed events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Run every minute to update expired bookings 
// cron.schedule('* * * * *', async () => {
//   try {
//     const pool = await poolPromise;
//     await pool.request().query(`
//       UPDATE bookings
//       SET event_status = 'Complete'
//       WHERE (date < CAST(GETDATE() AS DATE))
//          OR (date = CAST(GETDATE() AS DATE) AND end_time < CAST(GETDATE() AS TIME));
//     `);
//     console.log("✅ Booking statuses updated automatically");
//   } catch (error) {
//     console.error("❌ Error updating booking statuses:", error);
//   }
// });


// ✅ Start the server
const PORT = 5001;
app.get('/', (req, res) => {
  res.send('Booking is running...');
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
