import React, { useState, useEffect } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);

  const [forgotPassword, setForgotPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [otpExpiration, setOtpExpiration] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorMsg = queryParams.get("error");
    if (errorMsg === "SessionExpired") {
      setError("Your session has expired. Please log in again.");
    } else if (errorMsg === "LoggedOut") {
      setError("You have successfully logged out.");
    }
  }, [location.search]);
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      axios
        .get("http://localhost:5000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUserData(response.data.user);
        })
        .catch((err) => {
          console.error("Error fetching user data", err);
          localStorage.removeItem("jwt_token");
          navigate("/");
        });
    }
  }, [navigate]);
  useEffect(() => {
    if (otpExpiration && Date.now() > otpExpiration) {
      setOtpSent(false); // Reset OTP input if expired
    }
  }, [otpExpiration]);

  const allowedDomains = ["gmail", "yahoo", "outlook"]; // Add more providers if needed
  const allowedTLDs = ["com", "org", "net"]; // Restrict to .com, .org, .net

  // Function to check email/phone existence
  const checkExistence = async (email, phone) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/check-existence",
        { email, phone }
      );
      return response.data; // { emailAvailable: true/false, phoneAvailable: true/false }
    } catch (error) {
      console.error("Error checking existence:", error);
      return { emailAvailable: true, phoneAvailable: true }; // Assume available if error occurs
    }
  };

  const emailValidation = (isSignup) => {
    return Yup.string()
      .email("Invalid email address")
      .test(
        "validDomain",
        "Email must be from allowed providers (e.g., Gmail, Yahoo, Outlook)",
        (value) => {
          if (!value) return true; // Allow empty (required check later)
          const domainMatch = value.match(/@([\w-]+)\.(\w+)$/);
          if (!domainMatch) return false; // Invalid format

          const [, domain, tld] = domainMatch;
          return allowedDomains.includes(domain) && allowedTLDs.includes(tld);
        }
      )
      .test("checkEmailExists", async function (value) {
        if (!value) return true; // Skip if empty (required check later)
        if (!isSignup) return true; // ✅ Skip checking existence during login

        // Check if the email is already registered (only for signup)
        const response = await checkExistence(value, null);
        if (!response.emailAvailable) {
          return this.createError({ message: "Email is already registered" });
        }
        return true;
      })
      .required("Email is required");
  };

  // Phone validation
  const phoneValidation = Yup.string()
    .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .test("checkPhoneExists", async function (value) {
      if (!value) return true; // Allow empty (required check later)

      const response = await checkExistence(null, value);
      if (!response.phoneAvailable) {
        return this.createError({
          message: "Phone number is already registered",
        });
      }
      return true;
    })
    .required("Phone number is required");

  // Password validation (5-10 chars, upper/lowercase, number, special char)
  const passwordValidationRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@_$!%*?&]).{5,10}$/;
  const passwordValidation = Yup.string()
    .matches(
      passwordValidationRegex,
      "Password must be 5-10 characters, include an uppercase letter, a lowercase letter, a number, and a special character"
    )
    .required("Password is required");

  // Signup Schema
  const signupValidationSchema = Yup.object()
    .shape({
      name: Yup.string()
        .matches(
          /^[A-Za-z\s]+$/,
          "Name cannot contain numbers or special characters"
        )
        .required("Name is required"),
      email: emailValidation(true), // ✅ Pass 'true' for signup
      password: passwordValidation,
      phone: phoneValidation,
    })
    .defined();

  // Login Schema
  const loginValidationSchema = Yup.object()
    .shape({
      email: emailValidation(false), // ✅ Pass 'false' for login
      password: passwordValidation,
    })
    .defined();

   
  const handleResendOtp = async () => {
    if (!signupEmail) {
      alert("Email is missing. Please start the signup process again.");
      return;
    }
  
    try {
      setResendDisabled(true);
  
      const response = await fetch("http://localhost:5000/api/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: signupEmail }),
      });
  
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`); // Catch HTTP errors
      }
  
      const data = await response.json(); // Ensure response is valid JSON
  
      alert(data.message); // Show success message
  
      // Re-enable button after 3 minutes
      setTimeout(() => setResendDisabled(false), 180000);
    } catch (error) {
      console.error("Error resending OTP:", error);
      alert(error.message || "Failed to resend OTP.");
      setResendDisabled(false);
    }
  };
  
  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword((prev) => !prev);
    } else if (field === "newPassword") {
      setShowNewPassword((prev) => !prev);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword((prev) => !prev);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");

    const emailSchema = Yup.object({
      email: forgotPasswordValidationSchema.fields.email,
    });

    try {
      await emailSchema.validate({ email });

      const response = await axios.post(
        "http://localhost:5000/api/send-reset-otp",
        { email }
      );

      alert(response.data.message);
      setOtpSent(true);
      setOtpExpiration(Date.now() + 3 * 60 * 1000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to send OTP";

      if (errorMessage.includes("OTP already sent")) {
        // If OTP is already sent, directly go to the OTP input field
        setOtpSent(true);
      } else {
        setEmailError(errorMessage);
      }
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");

    if (!otp) {
      setOtpError("OTP is required");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/verify-reset-otp",
        { email, otp }
      );
      alert(response.data.message);
      setOtpVerified(true);
    } catch (error) {
      setOtpError(
        error.response?.data?.message || error.message || "Invalid OTP"
      );
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError("");

    const passwordSchema = Yup.object({
      newPassword: forgotPasswordValidationSchema.fields.newPassword,
      confirmPassword: forgotPasswordValidationSchema.fields.confirmPassword,
    });

    try {
      await passwordSchema.validate({ newPassword, confirmPassword });

      const response = await axios.post(
        "http://localhost:5000/api/reset-password",
        {
          email,
          newPassword,
        }
      );

      alert(response.data.message);
      setIsLogin(true);
      setForgotPassword(false);
    } catch (error) {
      setChangePasswordError(
        error.response?.data?.message ||
          error.message ||
          "Password reset failed"
      );
    }
  };

  const forgotPasswordValidationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .test({
        name: "emailExists",
        message: "Email is not registered",
        test: async (value) => {
          if (!value) return false;
          try {
            const response = await axios.post(
              "http://localhost:5000/api/check-existence",
              {
                email: value,
              }
            );
            return !response.data.emailAvailable;
          } catch (error) {
            return false;
          }
        },
      }),

    newPassword: Yup.string()
      .matches(
        passwordValidationRegex,
        "Password must be 5-6 characters, include an uppercase letter, a lowercase letter, a number, and a special character"
      )
      .required("New password is required"),

    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setUserData(null);
    navigate("/");
  };

  return (
    <>
     
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-6">
        {userData ? (
          <div className="p-6 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome, {userData.name}</h2>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        ) : (
          <div className="lg:mt-28 w-full max-w-md p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? "Login" : "Sign Up"}</h2>
            {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={formik.handleSubmit}>
              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={otpSent} // Disable when OTP is sent
                    className="w-full p-2 border rounded bg-white"
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-red-500 text-sm">{formik.errors.name}</p>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={otpSent} // Disable when OTP is sent
                  className="w-full p-2 border rounded bg-white"
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-red-500 text-sm">{formik.errors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={otpSent} // Disable when OTP is sent
                    className="w-full p-2 border rounded pr-10 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-red-500 text-sm">{formik.errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={otpSent} // Disable when OTP is sent
                    className="w-full p-2 border rounded bg-white"
                  />
                  {formik.touched.phone && formik.errors.phone && (
                    <p className="text-red-500 text-sm">{formik.errors.phone}</p>
                  )}
                </div>
              )}
            

              <button type="submit" className="w-full bg-brown-light text-white p-2 rounded hover:bg-brown">
              {isLogin ? "Login" : otpSent ? "Verify OTP" : "Sign Up"}
              </button>
            </form>
            {otpSent && !otpVerified && (
          <div className="mt-4">
            <label className="block text-gray-700">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            />
            <button onClick={handleResendOtp} disabled={resendDisabled} className="w-full bg-gray-400 text-white p-2 rounded mt-2">
              {resendDisabled ? "Wait to resend" : "Error"}
            </button>
          </div>
        )}

            {isLogin && (
              <div className="text-center mt-4">
                <span onClick={() => setForgotPassword(true)} className="text-brown cursor-pointer">
                  Forgot Password?
                </span>
              </div>
            )}

            {forgotPassword && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

                  {changePasswordError && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{changePasswordError}</div>}

                 {/* Step 1: Email Input */}
                 {!otpSent && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-2 border rounded bg-white"
                        />
                        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                      </div>

                      <button type="submit" className="w-full bg-brown-light text-white p-2 rounded hover:bg-brown">
                        Send OTP
                      </button>
                    </form>
                  )}

                  {/* Step 2: OTP Input */}
                  {otpSent && !otpVerified && (
                    <form onSubmit={verifyOtp} className="space-y-4">
                      <div className="mb-4">
                        <label className="block text-gray-700">Enter OTP</label>
                        <input
                          type="text"
                          name="otp"
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full p-2 border rounded bg-white"
                        />
                        {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
                      </div>

                      <button type="submit" className="w-full bg-brown-light text-white p-2 rounded hover:bg-brown">
                        Verify OTP
                      </button>


                    </form>
                  )}

                  {/* Step 3: New Password Input */}
                  {otpVerified && (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="mb-4">
                        <label className="block text-gray-700">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 border rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-2 text-gray-500"
                          >
                            {showNewPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-700">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-2 text-gray-500"
                          >
                            {showConfirmPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        {confirmPasswordError && <p className="text-red-500 text-sm">{confirmPasswordError}</p>}
                      </div>

                      <button type="submit" className="w-full bg-brown-light text-white p-2 rounded hover:bg-brown">
                        Change Password
                      </button>
                    </form>
                  )}

                  <button
                    onClick={() => setForgotPassword(false)}
                    className="mt-4 w-full bg-gray-300 text-gray-700 p-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <p className="mt-4 text-center">
              {isLogin ? (
                <span onClick={() => setIsLogin(false)} className="text-black cursor-pointer">
                  Don't have an account? <span className="text-brown-light">Sign Up</span>
                </span>
              ) : (
                <span onClick={() => setIsLogin(true)} className="text-black cursor-pointer">
                  Already have an account? <span className="text-brown-light">Login</span>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

    </>
  );

}
export default Login;