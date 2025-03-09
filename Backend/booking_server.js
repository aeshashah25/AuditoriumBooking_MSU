import sql from 'mssql';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
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

// ✅ Format Time Helper Function (Move this outside the routes to use in both)

// Route for checking existing bookings
// Endpoint to get existing bookings for a given date and auditorium
app.get('/get-existing-bookings', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { date, auditorium_id } = req.query;
    if (!date || !auditorium_id) {
      return res.status(400).json({ message: "Invalid date or auditorium_id" });
    }

    const result = await pool.request()
      .input('Date', sql.Date, date)
      .input('AuditoriumId', sql.Int, auditorium_id)
      .query('SELECT start_time, end_time FROM bookings WHERE date = @Date AND AuditoriumID = @AuditoriumId');

    const bookings = result.recordset.map(booking => ({
      start_time: formatTimeFromSQL(booking.start_time), // Use formatTimeFromSQL
      end_time: formatTimeFromSQL(booking.end_time),
    }));

    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings. Please try again." });
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
  const { user_id, date, start_time, end_time, auditorium_id, event_name } = req.body;

  console.log('Received booking request:', req.body);

  if (!user_id || !date || !start_time || !end_time || !auditorium_id || !event_name) {
    return res.status(400).json({ message: 'Please provide all booking details.' });
  }

  try {
    // Ensure times are in the correct format for SQL
    const sqlStartTime = formatTimeToSQL(start_time);
    const sqlEndTime = formatTimeToSQL(end_time);

    console.log(`Formatted Times: Start - ${sqlStartTime}, End - ${sqlEndTime}`);
    console.log('Executing query with parameters:', {
      UserId: user_id,
      Date: date,
      StartTime: sqlStartTime,
      EndTime: sqlEndTime,
      AuditoriumId: auditorium_id,
      EventName: event_name
    });

    const pool = await poolPromise;
    await pool.request()
      .input('UserId', sql.Int, user_id)
      .input('Date', sql.Date, date)
      .input('StartTime', sql.VarChar, sqlStartTime) // Pass the time in proper format
      .input('EndTime', sql.VarChar, sqlEndTime)
      .input('AuditoriumId', sql.Int, auditorium_id)
      .input('EventName', sql.VarChar, event_name)
      .execute('InsertBooking'); // Assuming the stored procedure is defined in SQL Server

    res.status(200).json({ message: 'Booking Request Sent Successfully' });
  } catch (err) {
    console.error('Error during booking:', err);
    res.status(500).json({ message: 'Error during booking', error: err.message });
  }
});

function formatTimeToSQL(timeString) {
  // Debug: Log the original time string
  console.log('Original timeString:', timeString);

  // Ensure the input is in 'HH:mm' format and convert it to 'HH:mm:ss'
  if (timeString.length === 5) {
    const formattedTime = `${timeString}:00`;

    // Debug: Log the formatted time before returning
    console.log('Formatted time:', formattedTime);

    return formattedTime;
  }

  // Debug: Log when no formatting is needed
  console.log('No formatting needed, returning:', timeString);

  return timeString;
}

// ✅ GET all auditoriums
app.get('/get-auditoriums', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM auditoriums');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching auditoriums:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/admin/view-pending-booking-requests', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Execute the stored procedure GetPendingBookings
    const result = await pool.request().execute('GetPendingBookings');

    // Format the result data
    const formattedRequests = result.recordset.map(request => {
      //console.log('Raw Start Time:', request.StartTime);  // Log raw time data
      //console.log('Raw End Time:', request.EndTime);  // Log raw time data

      return {
        booking_id: request.BookingId,
        user_id: request.UserId,
        username: request.Username || 'N/A',
        auditorium_id: request.AuditoriumId,
        auditorium_name: request.AuditoriumName || 'N/A',
        date: new Date(request.BookingDate).toLocaleDateString(),
        start_time: formatTimeFromSQL(request.StartTime),  // Format the start time
        end_time: formatTimeFromSQL(request.EndTime),  // Format the end time
        event_name: request.EventName || 'No event specified',
      };
    });

    res.status(200).json(formattedRequests);

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ message: 'Error fetching booking requests' });
  }
});

// ✅ GET: Fetch price per hour of an auditorium
app.get('/get-auditorium-price/:auditoriumId', async (req, res) => {
  let { auditoriumId } = req.params;

  auditoriumId = Number(auditoriumId);
  if (isNaN(auditoriumId)) {
    return res.status(400).json({ error: 'Invalid auditorium ID' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('auditoriumId', sql.Int, auditoriumId)
      .query('SELECT price_per_hour FROM auditoriums WHERE id = @auditoriumId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Auditorium not found' });
    }

    res.status(200).json({ pricePerHour: result.recordset[0].price_per_hour });
  } catch (error) {
    console.error('Error fetching auditorium price:', error);
    res.status(500).json({ message: 'Error fetching auditorium price' });
  }
});

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

// Send Payment Request and Update Total Amount
app.post("/admin/send-payment-request", async (req, res) => {
  const { bookingId, amount } = req.body;

  // Validate input
  if (!bookingId || isNaN(bookingId)) {
    return res.status(400).json({ error: "Valid Booking ID is required" });
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Valid payment amount is required" });
  }

  try {
    const pool = await poolPromise;

    // Call the stored procedure
    const result = await pool.request()
      .input("bookingId", sql.Int, bookingId)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("payment_due", sql.DateTime, new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours from now
      .execute("ApproveBooking"); 

    console.log("Stored Procedure Execution Result:", result.recordsets);

    if (result.rowsAffected && result.rowsAffected[0] > 0) {
      return res.status(200).json({ message: "Payment request sent successfully" });
    } else {
      return res.status(404).json({ error: "Booking ID not found or update failed" });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Reject Booking API
app.post("/admin/reject-booking", async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId || isNaN(bookingId)) {
    return res.status(400).json({ success: false, message: "Valid Booking ID is required." });
  }

  try {
    const pool = await poolPromise;
    console.log("🔍 Rejecting Booking ID:", bookingId);

    // Check if the booking exists before calling the stored procedure
    const checkBooking = await pool.request()
      .input("bookingId", sql.Int, bookingId)
      .query("SELECT * FROM bookings WHERE id = @bookingId");

    console.log("✅ Booking Found:", checkBooking.recordset);

    if (checkBooking.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Booking ID not found in database." });
    }

    // Debugging: Log before calling stored procedure
    console.log("🚀 Executing Stored Procedure RejectBooking...");

    // Call the stored procedure
    const result = await pool.request()
      .input("bookingId", sql.Int, bookingId)
      .execute("RejectBooking");

    console.log("✅ Stored Procedure Execution Result:", result);

    // Debugging: Log the rows affected
    console.log("🔍 Rows Affected:", result.rowsAffected);

    // Check rows affected manually
    if (result.rowsAffected.length > 0 && result.rowsAffected[0] > 0) {
      console.log("✅ Booking successfully rejected!");
      return res.status(200).json({ success: true, message: "Booking request rejected successfully." });
    } else {
      console.log("❌ No rows affected - Booking was already processed.");
      return res.status(400).json({ success: false, message: "Booking was already rejected or processed." });
    }
    
  } catch (error) {
    console.error("❌ Error rejecting booking:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
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
