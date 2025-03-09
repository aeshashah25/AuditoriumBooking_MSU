import React, { useState, useEffect } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap for additional styling
import "../styles/FormStyle.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true); // State to toggle between Login and SignUp
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null); // To store user data from /api/me
  const navigate = useNavigate();
  const location = useLocation(); // To access query parameters

  // Check for error messages in the query string
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorMsg = queryParams.get("error");
    if (errorMsg === "SessionExpired") {
      setError("Your session has expired. Please log in again.");
    } else if (errorMsg === "LoggedOut") {
      setError("You have successfully logged out.");
    }
  }, [location.search]);

  // Fetch user data from /api/me if the token exists
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      axios
        .get("http://localhost:5000/api/me", {
          headers: { Authorization: Bearer ${token} },
        })
        .then((response) => {
          setUserData(response.data.user);
        })
        .catch((err) => {
          console.error("Error fetching user data", err);
          localStorage.removeItem("jwt_token"); // Clear token if invalid
          navigate("/"); // Redirect to login if token is invalid
        });
    }
  }, [navigate]);

  // Formik validation schema
  const validationSchema = Yup.object({
    name: Yup.string().when("isLogin", {
      is: false,
      then: Yup.string().required("Name is required"),
    }),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    phone: Yup.string().when("isLogin", {
      is: false,
      then: Yup.string()
        .required("Phone number is required")
        .matches(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    }),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      isLogin,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const endpoint = isLogin ? "/api/login" : "/api/signup";
        const response = await axios.post(http://localhost:5000${endpoint}, values);

        alert(response.data.message);

        // Check if token is in response
        if (response.data.token) {
          // Save token to localStorage
          localStorage.setItem('jwt_token', response.data.token);
        }

        if (isLogin) {
          navigate("/MainPage"); // Redirect to MainPage after successful login
        } else {
          setIsLogin(true); // Redirect to login page after signup
        }
      } catch (err) {
        setError(err.response?.data?.message || "An error occurred.");
      }
    },
  });

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("jwt_token"); // Clear the JWT token
    setUserData(null); // Clear user data
    navigate("/"); // Redirect to login page
  };

  return (
    <div className="form-container">
      {userData ? (
        <div>
          <h2>Welcome, {userData.name}</h2>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <>
          <h2>{isLogin ? "Login" : "Sign Up"}</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={formik.handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={form-control ${formik.touched.name && formik.errors.name ? "is-invalid" : ""}}
                />
                {formik.touched.name && formik.errors.name && (
                  <div className="invalid-feedback">{formik.errors.name}</div>
                )}
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={form-control ${formik.touched.email && formik.errors.email ? "is-invalid" : ""}}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="invalid-feedback">{formik.errors.email}</div>
              )}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={form-control ${formik.touched.password && formik.errors.password ? "is-invalid" : ""}}
              />
              {formik.touched.password && formik.errors.password && (
                <div className="invalid-feedback">{formik.errors.password}</div>
              )}
            </div>
            {!isLogin && (
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={form-control ${formik.touched.phone && formik.errors.phone ? "is-invalid" : ""}}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <div className="invalid-feedback">{formik.errors.phone}</div>
                )}
              </div>
            )}
            <button className="form-button" type="submit">
              {isLogin ? "Login" : "Sign Up"}
            </button>
            <p>
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <span onClick={() => setIsLogin(false)} style={{ cursor: "pointer" }}>
                    Sign Up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span onClick={() => setIsLogin(true)} style={{ cursor: "pointer" }}>
                    Login
                  </span>
                </>
              )}
            </p>
          </form>
        </>
      )}
    </div>
  );
};

export default Auth;