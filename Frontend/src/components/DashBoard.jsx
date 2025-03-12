import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate,Routes, Route, Link } from "react-router-dom";
import { FaHome, FaEye, FaUser, FaSignOutAlt, FaClipboardList, FaBars, FaTimes } from "react-icons/fa";
import { MdPayments, MdEvent, MdMiscellaneousServices } from "react-icons/md";
import { BsFillBookmarkCheckFill } from "react-icons/bs";
import DashboardContent from "./DashboardContent";
import CreateAuditorium from "../admin/CreateAuditoriums";
import ViewAuditoriums from "../admin/ViewAuditoriums";
import ViewUser from "../admin/ViewUser";
import ViewBookingRequests from "../admin/ViewBookingRequests";
import ViewBookingStatus from "../admin/ViewBookingStatus";
import ViewPaymentStatus from "../admin/ViewPaymentStatus";
import ViewEventStatus from "../admin/ViewEventStatus";
import AmenitiesList from "../admin/AmenitiesList";

const DashBoard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAuditoriums: 0,
    pendingRequests: 0,
    completedBookings: 0,
    paymentRequests: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5002/api/dashboard-stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const isTokenExpired = (token) => {
    if (!token) return true;
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return exp < Math.floor(Date.now() / 1000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jwt_token");

      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("jwt_token");
        navigate("/");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
      } catch (error) {
        setError("Failed to fetch user data. Please log in again.");
        localStorage.removeItem("jwt_token");
        navigate("/");
      }
    };

    fetchUser();
    const intervalId = setInterval(() => {
      if (isTokenExpired(localStorage.getItem("jwt_token"))) {
        localStorage.removeItem("jwt_token");
        setUser(null);
        navigate("/");
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen w-[250px] lg:w-[300px] bg-gray-900 text-white transition-transform transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 z-50 shadow-lg`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        <nav className="flex flex-col mt-4 space-y-4 px-4">
          <Link to="/DashBoard/create-auditorium" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <FaHome className="mr-2" /> Add Auditorium
          </Link>
          <Link to="/DashBoard/view-auditoriums" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <FaEye className="mr-2" /> View Auditorium
          </Link>
          <Link to="/DashBoard/view-user" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <FaUser className="mr-2" /> View User
          </Link>
          <Link to="/DashBoard/view-booking-requests" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <FaClipboardList className="mr-2" /> View Booking Requests
          </Link>
          <Link to="/DashBoard/view-booking-status" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <BsFillBookmarkCheckFill className="mr-2" /> View Booking Status
          </Link>
          <Link to="/DashBoard/view-payment-status" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <MdPayments className="mr-2" /> View Payment Status
          </Link>
          <Link to="/DashBoard/view-event-status" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <MdEvent className="mr-2" /> View Event Status
          </Link>
          <Link to="/DashBoard/amenities-list" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <MdMiscellaneousServices className="mr-2" /> Amenities List
          </Link>
          <button onClick={handleLogout} className="flex items-center px-4 py-2 rounded-lg hover:bg-red-600 transition">
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-[250px] p-4 flex-1">
        <Routes>
        <Route index element={<DashboardContent />} /> {/* Default route */}
        <Route path="dashboard-content" element={<DashboardContent />} />
          {/* <Route path="dashboard-content" element={<DashboardContent />} /> */}
          <Route path="create-auditorium" element={<CreateAuditorium />} />
          <Route path="view-auditoriums" element={<ViewAuditoriums />} />
          <Route path="view-user" element={<ViewUser />} />
          <Route path="view-booking-requests" element={<ViewBookingRequests />} />
          <Route path="view-booking-status" element={<ViewBookingStatus />} />
          <Route path="view-payment-status" element={<ViewPaymentStatus />} />
          <Route path="view-event-status" element={<ViewEventStatus />} />
          <Route path="amenities-list" element={<AmenitiesList />} />
        </Routes>
      </div>
    </div>
  );
};

export default DashBoard;
