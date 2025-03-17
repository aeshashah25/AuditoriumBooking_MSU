import sql from 'mssql';
import express from 'express';
import cors from 'cors';
import nodemailer from "nodemailer";

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
  const { booking_id, action, approved_discount, reject_reason, user_email } = req.body;

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

    // Send Email Notification to User
    // ✅ Send Email Notification after update
    if (user_email) {
      await sendEmailNotification(user_email, action, reject_reason,approved_discount);
    }
    //await sendEmailNotification(user_email, action, reject_reason, approved_discount);

    res.json(result.recordset[0]); // Return the message from the stored procedure
  } catch (error) {
    console.error("❌ Database Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
// Function to Send Email Notification
async function sendEmailNotification(email, action, rejectReason, discount) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "jankichauhan2410@gmail.com", // Replace with your email
      pass: "uhgj gglw snzg kjlx", // Replace with your app-specific password
    },
  });

  let subject, message;
  if (action === "approve") {
    subject = "Booking Approved 🎉";
    message = `Your booking has been approved! ${discount ? `A discount of ${discount}% has been applied.` : ""
      }`;
  } else {
    subject = "Booking Rejected ❌";
    message = `Your booking was rejected. Reason: ${rejectReason}`;
  }

  let mailOptions = {
    from: "jankichauhan2410@gmail.com",
    to: email,
    subject: subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
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
        FORMAT(b.date, 'yyyy-MM-dd') AS date,
        b.start_time,
        b.end_time,
		    b.booking_status,
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
