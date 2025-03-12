import dotenv from "dotenv";
import express from "express";
import sql from "mssql";
import multer from "multer";
import cors from "cors";
import imageType from "image-type";
import fs from "fs";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";


// Load environment variables
dotenv.config();

const app = express();

// Enable CORS
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { trustServerCertificate: true },
  port: 1433,
};

// Connect to the database

  const poolPromise = new sql.ConnectionPool(dbConfig).connect();

  // Store images in memory (Buffer) for direct database storage
  const storage = multer.memoryStorage();
  
  const upload = multer({
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB per file
  });
  
  app.post("/api/create-auditorium", upload.array("images", 5), async (req, res) => {
    console.log("Received Files:", req.files);
    console.log("Received Body:", req.body);

    const { name, description, capacity, location, price_per_hour, start_time, end_time } = req.body;
    const images = req.files;

    // 🛠 Fix amenities parsing
    let amenitiesJSON;
    if (typeof req.body.amenities === "string") {
        try {
            amenitiesJSON = JSON.parse(req.body.amenities.trim()); // Ensure it's valid JSON
        } catch (err) {
            return res.status(400).json({ message: "Invalid JSON format for amenities" });
        }
    } else if (Array.isArray(req.body.amenities)) {
        // If amenities is an array, extract the JSON part
        try {
            amenitiesJSON = JSON.parse(req.body.amenities.find(item => item.startsWith("[{")));  
        } catch (err) {
            return res.status(400).json({ message: "Invalid JSON format in amenities array" });
        }
    } else {
        amenitiesJSON = req.body.amenities;
    }
    

    if (!name || !description || !capacity || !location || !price_per_hour || !start_time || !end_time || !images || images.length === 0 || !amenitiesJSON) {
        return res.status(400).json({ message: "All required fields including amenities and at least one image must be provided" });
    }

    try {
        const formattedStartTime = moment(start_time, ["HH:mm", "h:mm A"], true).format("HH:mm:ss");
        const formattedEndTime = moment(end_time, ["HH:mm", "h:mm A"], true).format("HH:mm:ss");

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Convert images to base64 and store as JSON
            const imageDataArray = images.map(file => ({
                mimeType: file.mimetype,
                data: file.buffer.toString("base64")
            }));
            const imagesJSON = JSON.stringify(imageDataArray);

            // Insert auditorium with images and amenities
            const auditoriumResult = await transaction.request()
            .input("name", sql.NVarChar, name)
            .input("description", sql.NVarChar, description)
            .input("capacity", sql.Int, capacity)
            .input("location", sql.NVarChar, location)
            .input("price_per_hour", sql.Decimal(10, 2), price_per_hour)
            .input("start_time", sql.NVarChar, formattedStartTime)
            .input("end_time", sql.NVarChar, formattedEndTime)
            .input("images", sql.NVarChar, imagesJSON)
            .input("amenities", sql.NVarChar, JSON.stringify(amenitiesJSON))
            .output("auditoriumId", sql.Int)  // ✅ Capture output
            .execute("sp_CreateAuditorium");
        
        const insertedId = auditoriumResult.output.auditoriumId;  // ✅ Get the inserted ID
        
        await transaction.commit();
        res.status(201).json({ 
            message: "Auditorium created successfully!", 
            auditoriumId: insertedId,  // ✅ Return the ID
            amenities: amenitiesJSON 
        });
        

        } catch (err) {
            await transaction.rollback();
            console.error("Error inserting auditorium:", err);
            res.status(500).json({ message: "Failed to insert auditorium", error: err.message });
        }

    } catch (err) {
        console.error("Transaction Error:", err);
        res.status(500).json({ message: "Failed to start transaction", error: err.message });
    }
});


app.get("/api/auditoriums", async (req, res) => {
  try {
    const id = req.query.id ? parseInt(req.query.id, 10) : null; // Ensure `id` is a number
    const pool = await poolPromise;
    
    let query = "SELECT * FROM auditoriums WHERE is_deleted <> 1";
    const request = pool.request();

    if (id) {
      query += " AND id = @id";
      request.input("id", id); // Ensure the ID is passed correctly
    }

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: id ? "Auditorium not found" : "No auditoriums found" });
    }

    // Parse images and amenities safely
    const auditoriums = result.recordset.map(auditorium => {
      try {
        auditorium.images = auditorium.images ? JSON.parse(auditorium.images) : [];
      } catch (error) {
        console.error("Error parsing images:", error);
        auditorium.images = [];
      }

      try {
        auditorium.amenities = auditorium.amenities ? JSON.parse(auditorium.amenities) : [];
      } catch (error) {
        console.error("Error parsing amenities:", error);
        auditorium.amenities = [];
      }

      return auditorium;
    });

    res.status(200).json(id ? auditoriums[0] : auditoriums);
  } catch (err) {
    console.error("Error fetching auditoriums:", err);
    res.status(500).json({ message: "Failed to retrieve auditoriums", error: err.message });
  }
});

// API to Mark Auditorium as Under Maintenance or soft Delete
app.post("/api/auditoriums/:id/toggle-maintenance", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    // Check the current status of the auditorium
    const checkResult = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT is_deleted FROM auditoriums WHERE id = @id");

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Auditorium not found." });
    }

    const isUnderMaintenance = checkResult.recordset[0].is_deleted === true;

    let result;
    if (isUnderMaintenance) {
      // Restore auditorium
      result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("UPDATE auditoriums SET is_deleted = 0 WHERE id = @id");
    } else {
      // Mark as under maintenance
      result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("UPDATE auditoriums SET is_deleted = 1 WHERE id = @id");
    }

    // If no rows were updated, return an error
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Auditorium not found or update failed." });
    }

    res.status(200).json({
      message: isUnderMaintenance
        ? "Auditorium restored successfully."
        : "Auditorium marked as under maintenance.",
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update auditorium details
app.put("/api/auditoriums/:id", upload.array("images", 5), async (req, res) => {
  const { id } = req.params;

  const { 
    name, description, capacity, location, price_per_hour, 
    start_time, end_time, amenities, is_deleted 
  } = req.body;

  if (!start_time || !end_time) {
    return res.status(400).json({ message: "start_time and end_time are required." });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();

    // Convert values to proper types
    request.input("id", sql.Int, Number(id));
    request.input("name", sql.NVarChar, name);
    request.input("description", sql.NVarChar, description);
    request.input("capacity", sql.Int, capacity);
    request.input("location", sql.NVarChar, location);
    request.input("price_per_hour", sql.Decimal(10, 2), price_per_hour);
    request.input("start_time", sql.NVarChar, start_time); 
    request.input("end_time", sql.NVarChar, end_time);
    request.input("is_deleted", sql.Bit, is_deleted === "true" || is_deleted === "1");

    // ✅ Convert Images to JSON { mimetype, data }
    let imagesArray = [];

    if (req.files && req.files.length > 0) {
      imagesArray = req.files.map((file) => ({
        mimetype: file.mimetype,
        data: file.buffer.toString("base64")
      }));
    }

    request.input("images", sql.NVarChar(sql.MAX), imagesArray.length ? JSON.stringify(imagesArray) : null);

    // ✅ Parse Amenities JSON Properly
    let amenitiesJSON;
    if (typeof amenities === "string") {
      try {
        amenitiesJSON = JSON.parse(amenities.trim());
      } catch (err) {
        return res.status(400).json({ message: "Invalid JSON format for amenities" });
      }
    } else if (Array.isArray(amenities)) {
      try {
        amenitiesJSON = JSON.parse(amenities.find(item => item.startsWith("[{")));  
      } catch (err) {
        return res.status(400).json({ message: "Invalid JSON format in amenities array" });
      }
    } else {
      amenitiesJSON = amenities;
    }

    request.input("amenities", sql.NVarChar(sql.MAX), JSON.stringify(amenitiesJSON) || null);

    // 🔍 Check if Auditorium Exists Before Updating
    const checkExistence = await pool.request()
      .input("id", sql.Int, Number(id))
      .query("SELECT COUNT(*) AS count FROM auditoriums WHERE id = @id");

    if (checkExistence.recordset[0].count === 0) {
      return res.status(404).json({ message: "Auditorium not found." });
    }

    // Execute stored procedure
    const result = await request.execute("sp_UpdateAuditorium");

    const rowsAffected = result.recordset?.[0]?.rowsAffected || 0;
    
    if (rowsAffected > 0) {
      return res.status(200).json({ message: "Auditorium updated successfully" });
    } else {
      return res.status(404).json({ message: "Update executed, but no rows updated. Check stored procedure." });
    }

  } catch (error) {
    console.error("Error updating auditorium:", error);
    return res.status(500).json({ message: "Failed to update auditorium", error: error.message });
  }
});

app.get("/api/dashboard-counters", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        (SELECT COUNT(*) FROM UsersDetails) AS totalUsers,
        (SELECT COUNT(*) FROM auditoriums) AS totalAuditoriums,
        (SELECT COUNT(*) FROM bookings where booking_status='Complete') AS totalEvents,
        (SELECT COUNT(*) FROM Bookings) AS totalBookings
    `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching counters:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch users from UsersDetails
app.get("/api/users", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        id, name, email, phone,status,
        CASE 
          WHEN profilePic IS NOT NULL THEN CONCAT('http://localhost:5000/api/user/avatar/', id)
          ELSE NULL 
        END AS profilePic
      FROM UsersDetails
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//set User Active and DeActive
app.put("/api/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
      await sql.query`EXEC UpdateUserStatus ${id}, ${status}`;
      res.status(200).json({ message: "User status updated successfully" });
  } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

//show Details on Dashboard Page ->Admin Side
app.get("/api/dashboard-stats", async (req, res) => {
  try {
    // Query the database for each statistic
    const totalAuditoriumsResult = await sql.query(`SELECT COUNT(*) AS totalAuditoriums FROM Auditoriums`);
    const pendingRequestsResult = await sql.query(`SELECT COUNT(*) AS pendingRequests FROM Bookings WHERE booking_status = 'Pending'`);
    const paymentRequestsResult = await sql.query(`SELECT COUNT(*) AS paymentRequests FROM Bookings WHERE booking_status = 'PaymentRequest'`);
    const completedBookingsResult = await sql.query(`SELECT COUNT(*) AS completedBookings FROM Bookings WHERE booking_status = 'Completed'`);
    const totalUsersResult = await sql.query(`SELECT COUNT(*) AS totalUsers FROM UsersDetails`);

    // Extract values from query results
    const stats = {
      totalAuditoriums: totalAuditoriumsResult.recordset[0].totalAuditoriums,
      pendingRequests: pendingRequestsResult.recordset[0].pendingRequests,
      completedBookings: completedBookingsResult.recordset[0].completedBookings,
      totalUsers: totalUsersResult.recordset[0].totalUsers,
      paymentRequests: paymentRequestsResult.recordset[0].paymentRequests
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// // 📌 GET all amenities from amenities table
// app.get("/amenities", async (req, res) => {
//   try {
//     if (!pool) {
//       return res.status(500).json({ message: "Database connection not established" });
//     }

//     const result = await pool.request().query("SELECT * FROM amenities");
//     res.json(result.recordset);
//   } catch (error) {
//     console.error("Error fetching amenities:", error);
//     res.status(500).json({ message: "Error fetching amenities", error: error.message });
//   }
// });

// // 📌 POST new amenity in amenities table
// app.post("/api/amenities", async (req, res) => {
//   const { name, price } = req.body;

//   if (!name || price === "") {
//     return res.status(400).json({ message: "Name and price are required" });
//   }

//   if (!pool) {
//     return res.status(500).json({ message: "Database connection not established" });
//   }

//   try {
//     await pool
//       .request()
//       .input("name", sql.VarChar, name)
//       .input("price", sql.Decimal(10, 2), price)
//       .execute("AddAmenity"); // Call the stored procedure

//     res.json({ message: "✅ Amenity added successfully" });
//   } catch (error) {
//     console.error("❌ Database error:", error);
//     res.status(500).json({ message: "Error adding amenity", error: error.message });
//   }
// });

// //Update amentity
// app.put("/api/amenities/:id", async (req, res) => {
//   const { id } = req.params;
//   const { name, price } = req.body;

//   try {
//     const pool = await sql.connect();
//     const result = await pool
//       .request()
//       .input("id", sql.Int, id)
//       .input("name", sql.NVarChar, name)
//       .input("price", sql.Decimal(10, 2), price)
//       .execute("UpdateAmenity");

//     const response = result.recordset[0];
//     res.json(response);
//   } catch (error) {
//     console.error("Error updating amenity:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //Delete amentity
// app.delete("/api/amenities/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const pool = await sql.connect();
//     const result = await pool.request().input("id", sql.Int, id).execute("DeleteAmenity");

//     const response = result.recordset[0];
//     res.json(response);
//   } catch (error) {
//     console.error("Error deleting amenity:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });



// Start the server
const port = 5002;
app.get('/', (req, res) => {
  res.send('Dashboard is running...');
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
