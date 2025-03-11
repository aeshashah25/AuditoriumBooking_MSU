import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";

const UpdateProfile = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null); // Holds the current profile picture URL
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from navigation state
  const { user, profilePicUrl: receivedProfilePicUrl } = location.state || {};

  useEffect(() => {
    if (receivedProfilePicUrl) {
      setProfilePicUrl(receivedProfilePicUrl);
    }
  }, [receivedProfilePicUrl]);

  //console.log("Received user:", user);
  //console.log("Received profilePicUrl:", receivedProfilePicUrl);

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email format").required("Email is required"),
    phone: Yup.string().required("Phone is required"),
  });

  // Formik for form handling
  const formik = useFormik({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const token = localStorage.getItem("jwt_token");

        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("email", values.email);
        formData.append("phone", values.phone);
        if (imagePreview) formData.append("profilePic", imagePreview);

        await axios.put("http://localhost:5000/api/user/update", formData, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        alert("Profile updated successfully!");
        navigate("/MainPage");
      } catch (err) {
        setError("Failed to update profile. Please try again.");
      }
    },
  });

  // Handle profile picture selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(file); // Store file object for API upload
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>
      )}
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Update Profile</h2>
        <form onSubmit={formik.handleSubmit}>
          {/* Profile Picture */}
          <div className="mb-4 text-center">
            <input
              type="file"
              name="profilePic"
              onChange={handleFileChange}
              accept="image/*"
              className="mb-2"
            />
            <div className="mb-4">
              {imagePreview ? (
                <img
                  alt="Profile"
                  src={URL.createObjectURL(imagePreview)}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : profilePicUrl ? (
                <img
                  alt="Profile"
                  src={profilePicUrl}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <img
                  alt="Profile"
                  src="/path/to/defaultProfilePic.jpg"
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full p-2 border rounded ${formik.touched.name && formik.errors.name ? "border-red-500" : "border-gray-300"
                }`}
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-sm">{formik.errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled // This disables the field
              className={`w-full p-2 border rounded bg-gray-100 cursor-not-allowed ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-gray-300"
                }`}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm">{formik.errors.email}</p>
            )}
          </div>


          {/* Phone Field */}
          <div className="mb-4">
            <label className="block text-gray-700">Phone</label>
            <input
              type="text"
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full p-2 border rounded ${formik.touched.phone && formik.errors.phone ? "border-red-500" : "border-gray-300"
                }`}
            />
            {formik.touched.phone && formik.errors.phone && (
              <p className="text-red-500 text-sm">{formik.errors.phone}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-brown text-white p-2 rounded-lg hover:bg-brown-light"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
