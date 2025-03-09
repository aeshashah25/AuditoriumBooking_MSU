import dotenv from "dotenv";
import express from "express";
import sql from "mssql";
import bcrypt from "bcryptjs";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";  // Import fs for file system operations
import imageType from "image-type";  // Import the image-type library

dotenv.config(); // Load environment variables

const app = express();

// Use JSON body parser
app.use(express.json());

// Use cookie parser for handling cookies
app.use(cookieParser());

// CORS setup to allow frontend requests and handle credentials (cookies)
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { 
    encrypt: true, // For Azure use true, for local use false
    trustServerCertificate: true // Change to false for production if using a valid certificate
  },
  port: 1433,
};


// For Get auditoriums
app.get('/api/auditoriums', async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query('SELECT * FROM auditoriums');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data from database');
  }
});

// Middleware to serve static files in the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint for fetching auditorium details
app.get('/api/auditoriums/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input("id", sql.Int, id).query('SELECT * FROM auditoriums WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Auditorium not found" });
    }

    const auditorium = result.recordset[0];

    function tryParseJSON(jsonString) {
      try {
        // Only try parsing if the input is a non-empty string
        if (jsonString && typeof jsonString === 'string') {
          return JSON.parse(jsonString);
        }
        return []; // Return empty array if string is empty or non-existent
      } catch (e) {
        console.error("Invalid JSON:", e, jsonString);
        return []; // Return empty array if JSON is invalid
      }
    }

    // Use tryParseJSON for amenities and availability fields
    const amenities = tryParseJSON(auditorium.amenities);
    const availability = tryParseJSON(auditorium.availability);

    // Return auditorium details along with amenities and availability
    res.json({
      id: auditorium.id,
      name: auditorium.name,
      description: auditorium.description,
      capacity: auditorium.capacity,
      location: auditorium.location,
      amenities: amenities,
      availability: availability,
      image: auditorium.image,
      price_per_hour: auditorium.price_per_hour,
      price_per_day: auditorium.price_per_day,
    });

  } catch (error) {
    console.error("Error fetching auditorium details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const poolPromise = sql.connect(dbConfig).then(pool => {
  return pool;
}).catch(err => {
  console.error("Database connection failed:", err);
  process.exit(1); // Exit if connection fails
});

// API endpoint to handle auditorium creation
app.post("/api/auditoriums", upload.single("image"), async (req, res) => {
  const { name, description, capacity, location, amenities, availability, price_per_hour, price_per_day } = req.body;
  const image = req.file ? req.file.filename : null;

  try {
    // Get the database connection pool
    const pool = await poolPromise;

    // SQL query to insert auditorium details
    const query = `
      INSERT INTO auditoriums (name, description, capacity, location, amenities, availability, image, price_per_hour, price_per_day)
      VALUES (@name, @description, @capacity, @location, @amenities, @availability, @image, @price_per_hour, @price_per_day)
    `;

    // Request object
    const request = pool.request();
    request.input("name", sql.NVarChar, name);
    request.input("description", sql.Text, description);
    request.input("capacity", sql.Int, capacity);
    request.input("location", sql.NVarChar, location);
    request.input("amenities", sql.NVarChar, amenities);
    request.input("availability", sql.Text, availability); // Store JSON as Text
    request.input("image", sql.NVarChar, image);
    request.input("price_per_hour", sql.Decimal, price_per_hour);
    request.input("price_per_day", sql.Decimal, price_per_day);

    // Execute query
    await request.query(query);

    res.status(200).json({ message: "Auditorium details saved successfully!" });
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).json({ message: "Failed to save auditorium details." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); // auditorium_server.js
